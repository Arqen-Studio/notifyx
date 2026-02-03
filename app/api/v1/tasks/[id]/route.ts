import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema, formatValidationError, createApiError } from "@/lib/validation";
import { ApiResponse, TaskResponse, generateRequestId } from "@/types/api";
import { rescheduleRemindersForTask, cancelFutureRemindersForTask } from "@/lib/reminders";
import { prisma as prismaClient } from "@/lib/prisma";

const REMINDER_OFFSETS: Record<string, number> = {
  "7d": 7 * 24 * 60 * 60,
  "1d": 1 * 24 * 60 * 60,
  "1h": 1 * 60 * 60,
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError(
          "UNAUTHORIZED",
          "You must be logged in to view tasks",
        ),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: taskId } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId,
        deleted_at: null,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        reminder_rules: true,
        reminders: {
          select: {
            id: true,
            scheduled_for: true,
            status: true,
            sent_at: true,
            interval_key: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        createApiError(
          "NOT_FOUND",
          "Task not found",
        ),
        { status: 404 }
      );
    }

    const response: ApiResponse<{ task: TaskResponse }> = {
      data: {
        task: {
          id: task.id,
          title: task.title,
          notes: task.notes,
          deadline_at: task.deadline_at.toISOString(),
          status: task.status,
          created_at: task.created_at.toISOString(),
          updated_at: task.updated_at.toISOString(),
          tags: task.tags.map((tt: { tag: { id: string; name: string } }) => ({
            id: tt.tag.id,
            name: tt.tag.name,
          })),
          reminder_rules: task.reminder_rules.map((rr) => ({
            id: rr.id,
            label: rr.label,
            offset_seconds: rr.offset_seconds,
            enabled: rr.enabled,
          })),
          reminders: task.reminders ? task.reminders.map((r) => ({
            id: r.id,
            scheduled_for: r.scheduled_for.toISOString(),
            status: r.status,
            sent_at: r.sent_at?.toISOString() || null,
            interval_key: r.interval_key,
          })) : [],
        },
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      createApiError(
        "INTERNAL_ERROR",
        "An error occurred while fetching the task. Please try again.",
      ),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError(
          "UNAUTHORIZED",
          "You must be logged in to update a task",
        ),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: taskId } = await params;
    const body = await request.json();

    const validationResult = updateTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationError(validationResult.error),
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        createApiError(
          "NOT_FOUND",
          "Task not found",
        ),
        { status: 404 }
      );
    }

    const { title, deadlineDate, deadlineTime, description, status, tags, reminders, clientId } = validationResult.data;

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.notes = description || null;
    }

    if (status !== undefined) {
      updateData.status = status === "Completed" ? "completed" : "active";
    }

    if (deadlineDate !== undefined) {
      const deadlineDateTime = deadlineTime 
        ? new Date(`${deadlineDate}T${deadlineTime}`)
        : new Date(`${deadlineDate}T23:59:59`);
      
      if (deadlineDateTime < new Date()) {
        return NextResponse.json(
          createApiError(
            "VALIDATION_ERROR",
            "Deadline must be in the future",
            { deadlineDate: "Deadline must be in the future" }
          ),
          { status: 400 }
        );
      }
      updateData.deadline_at = deadlineDateTime;
    }

    const task = await prisma.$transaction(async (tx) => {
      const taskBeforeUpdate = await tx.task.findUnique({
        where: { id: taskId },
        select: { deadline_at: true, status: true },
      });

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: updateData,
      });

      const deadlineChanged = updateData.deadline_at && 
        taskBeforeUpdate?.deadline_at.getTime() !== updateData.deadline_at.getTime();
      
      const statusChanged = updateData.status && 
        taskBeforeUpdate?.status !== updateData.status;

      if (deadlineChanged || (reminders !== undefined && updateData.deadline_at)) {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { enabled_intervals: true },
        });

        const enabledIntervals = user?.enabled_intervals || ["P3M", "P1M", "P3W", "P2W", "P1W", "P3D", "P1D"];
        
        const reminderIntervals = reminders
          ?.filter((r) => r.enabled)
          .map((r): string | null => {
            if (r.id === "7d") return "P1W";
            if (r.id === "1d") return "P1D";
            if (r.id === "1h") return null;
            return null;
          })
          .filter((interval): interval is "P1W" | "P1D" => interval !== null) || [];

        const intervalsToUse = reminderIntervals.length > 0 
          ? reminderIntervals.filter((interval) => enabledIntervals.includes(interval))
          : enabledIntervals;

        await rescheduleRemindersForTask(
          tx,
          taskId,
          userId,
          updateData.deadline_at || updatedTask.deadline_at,
          intervalsToUse
        );
      }

      if (statusChanged && (updateData.status === "completed" || updateData.status === "deleted")) {
        await cancelFutureRemindersForTask(tx, taskId);
      }

      if (tags !== undefined) {
        await tx.taskTag.deleteMany({
          where: { task_id: taskId },
        });

        if (tags.length > 0) {
          const tagIds: string[] = [];
          for (const tagName of tags) {
            const tag = await tx.tag.upsert({
              where: {
                user_id_name: {
                  user_id: userId,
                  name: tagName,
                },
              },
              create: {
                user_id: userId,
                name: tagName,
              },
              update: {},
            });
            tagIds.push(tag.id);
          }

          await tx.taskTag.createMany({
            data: tagIds.map((tagId) => ({
              task_id: taskId,
              tag_id: tagId,
            })),
          });
        }
      }

      if (reminders !== undefined) {
        await tx.reminderRule.deleteMany({
          where: { task_id: taskId },
        });

        if (reminders.length > 0) {
          const reminderRulesToCreate = reminders
            .filter((r) => r.enabled && REMINDER_OFFSETS[r.id])
            .map((r) => ({
              user_id: userId,
              task_id: taskId,
              label: r.label,
              offset_seconds: REMINDER_OFFSETS[r.id],
              enabled: true,
            }));

          if (reminderRulesToCreate.length > 0) {
            await tx.reminderRule.createMany({
              data: reminderRulesToCreate,
            });
          }
        }
      }

      return await tx.task.findUnique({
        where: { id: taskId },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          reminder_rules: true,
          reminders: {
            select: {
              id: true,
              scheduled_for: true,
              status: true,
              sent_at: true,
              interval_key: true,
            },
          },
        },
      });
    });

    if (!task) {
      throw new Error("Failed to update task");
    }

    const response: ApiResponse<{ task: TaskResponse }> = {
      data: {
        task: {
          id: task.id,
          title: task.title,
          notes: task.notes,
          deadline_at: task.deadline_at.toISOString(),
          status: task.status,
          created_at: task.created_at.toISOString(),
          updated_at: task.updated_at.toISOString(),
          tags: task.tags.map((tt: { tag: { id: string; name: string } }) => ({
            id: tt.tag.id,
            name: tt.tag.name,
          })),
          reminder_rules: task.reminder_rules.map((rr) => ({
            id: rr.id,
            label: rr.label,
            offset_seconds: rr.offset_seconds,
            enabled: rr.enabled,
          })),
          reminders: task.reminders && Array.isArray(task.reminders)
            ? task.reminders.map((r) => ({
                id: r.id,
                scheduled_for: r.scheduled_for.toISOString(),
                status: r.status,
                sent_at: r.sent_at?.toISOString() || null,
                interval_key: r.interval_key,
              }))
            : [],
        },
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      createApiError(
        "INTERNAL_ERROR",
        "An error occurred while updating the task. Please try again.",
      ),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError(
          "UNAUTHORIZED",
          "You must be logged in to delete a task",
        ),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: taskId } = await params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        createApiError(
          "NOT_FOUND",
          "Task not found",
        ),
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: {
          deleted_at: new Date(),
          status: "deleted",
        },
      });

      await cancelFutureRemindersForTask(tx, taskId);
    });

    const response: ApiResponse<{ message: string }> = {
      data: {
        message: "Task deleted successfully",
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      createApiError(
        "INTERNAL_ERROR",
        "An error occurred while deleting the task. Please try again.",
      ),
      { status: 500 }
    );
  }
}
