import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, formatValidationError, createApiError } from "@/lib/validation";
import { ApiResponse, CreateTaskResponse, TaskResponse, generateRequestId } from "@/types/api";
import { scheduleRemindersForTask } from "@/lib/reminders";

type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tagId = searchParams.get("tagId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "deadline";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const limit = parseInt(searchParams.get("limit") || "100");

    const includeArchived = searchParams.get("includeArchived") === "true";
    
    const where: {
      user_id: string;
      deleted_at?: Date | null;
      status?: string;
      tags?: { some: { tag_id: string } };
      OR?: Array<{ title?: { contains: string; mode: "insensitive" }; notes?: { contains: string; mode: "insensitive" } }>;
    } = {
      user_id: userId,
    };
    
    if (!includeArchived) {
      where.deleted_at = null;
    }

    if (status) {
      where.status = status === "completed" ? "completed" : "active";
    }

    if (tagId) {
      where.tags = {
        some: {
          tag_id: tagId,
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: {
      deadline_at?: "asc" | "desc";
      created_at?: "asc" | "desc";
    } = {};
    if (sortBy === "deadline") {
      orderBy.deadline_at = sortOrder as "asc" | "desc";
    } else if (sortBy === "created") {
      orderBy.created_at = sortOrder as "asc" | "desc";
    } else {
      orderBy.deadline_at = "asc";
    }

    const tasks = await prisma.task.findMany({
      where,
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
      orderBy,
      take: limit,
    });

    const formattedTasks: TaskResponse[] = tasks.map((task: {
      id: string;
      title: string;
      notes: string | null;
      deadline_at: Date;
      status: string;
      deleted_at: Date | null;
      created_at: Date;
      updated_at: Date;
      tags: Array<{ tag: { id: string; name: string } }>;
      reminder_rules: Array<{ id: string; label: string | null; offset_seconds: number; enabled: boolean }>;
      reminders: Array<{ id: string; scheduled_for: Date; status: string; sent_at: Date | null; interval_key: string | null }>;
    }) => ({
      id: task.id,
      title: task.title,
      notes: task.notes,
      deadline_at: task.deadline_at.toISOString(),
      status: task.status,
      deleted_at: task.deleted_at?.toISOString() || null,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString(),
      tags: task.tags.map((tt: { tag: { id: string; name: string } }) => ({
        id: tt.tag.id,
        name: tt.tag.name,
      })),
      reminder_rules: task.reminder_rules.map((rr: { id: string; label: string | null; offset_seconds: number; enabled: boolean }) => ({
        id: rr.id,
        label: rr.label,
        offset_seconds: rr.offset_seconds,
        enabled: rr.enabled,
      })),
      reminders: task.reminders.map((r: { id: string; scheduled_for: Date; status: string; sent_at: Date | null; interval_key: string | null }) => ({
        id: r.id,
        scheduled_for: r.scheduled_for.toISOString(),
        status: r.status,
        sent_at: r.sent_at?.toISOString() || null,
        interval_key: r.interval_key,
      })),
    }));

    const response: ApiResponse<{ tasks: TaskResponse[] }> = {
      data: {
        tasks: formattedTasks,
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
        "An error occurred while fetching tasks. Please try again.",
      ),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError(
          "UNAUTHORIZED",
          "You must be logged in to create a task",
        ),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const validationResult = createTaskSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationError(validationResult.error),
        { status: 400 }
      );
    }

    const { title, deadlineDate, deadlineTime, description, status, tags, reminders } = validationResult.data;

    // Construct date from user input (date/time without timezone)
    // The date string "2026-02-10T14:00" is interpreted as LOCAL time by JavaScript
    // On the server (Vercel runs in UTC), this means 14:00 UTC
    // This is actually correct for storage - we store the exact time the user entered
    // The frontend will convert UTC back to local time for display
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

    const dbStatus = status === "Completed" ? "completed" : "active";

    const tagIds: string[] = [];
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
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
    }

    const task = await prisma.$transaction(async (tx: PrismaTransaction) => {
      const newTask = await tx.task.create({
        data: {
          user_id: userId,
          title,
          notes: description || null,
          deadline_at: deadlineDateTime,
          status: dbStatus,
        },
      });

      if (tagIds.length > 0) {
        await tx.taskTag.createMany({
          data: tagIds.map((tagId) => ({
            task_id: newTask.id,
            tag_id: tagId,
          })),
        });
      }

      const taskWithRelations = await tx.task.findUnique({
        where: { id: newTask.id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          reminder_rules: true,
        },
      });

      if (!taskWithRelations) {
        throw new Error("Failed to create task");
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { enabled_intervals: true },
      });

      const enabledIntervals = user?.enabled_intervals || ["P3M", "P1M", "P3W", "P2W", "P1W", "P3D", "P1D"];
      
      const reminderIntervals = reminders
        ?.filter((r) => r.enabled)
        .map((r): "P3M" | "P1M" | "P3W" | "P2W" | "P1W" | "P3D" | "P1D" | null => {
          if (r.id === "P3M" || r.id === "P1M" || r.id === "P3W" || r.id === "P2W" || r.id === "P1W" || r.id === "P3D" || r.id === "P1D") {
            return r.id as "P3M" | "P1M" | "P3W" | "P2W" | "P1W" | "P3D" | "P1D";
          }
          if (r.id === "7d") return "P1W";
          if (r.id === "1d") return "P1D";
          return null;
        })
        .filter((interval): interval is "P3M" | "P1M" | "P3W" | "P2W" | "P1W" | "P3D" | "P1D" => interval !== null) || [];

      const intervalsToUse = reminderIntervals.length > 0 
        ? reminderIntervals.filter((interval) => enabledIntervals.includes(interval))
        : enabledIntervals;

      await scheduleRemindersForTask(tx, newTask.id, userId, deadlineDateTime, intervalsToUse);

      return taskWithRelations;
    });

    if (!task) {
      throw new Error("Failed to create task");
    }

    const response: ApiResponse<CreateTaskResponse> = {
      data: {
        task: {
          id: task.id,
          title: task.title,
          notes: task.notes,
          deadline_at: task.deadline_at.toISOString(),
          status: task.status,
          deleted_at: task.deleted_at?.toISOString() || null,
          created_at: task.created_at.toISOString(),
          updated_at: task.updated_at.toISOString(),
          tags: task.tags.map((tt: { tag: { id: string; name: string } }) => ({
            id: tt.tag.id,
            name: tt.tag.name,
          })),
          reminder_rules: task.reminder_rules.map((rr: { id: string; label: string | null; offset_seconds: number; enabled: boolean }) => ({
            id: rr.id,
            label: rr.label,
            offset_seconds: rr.offset_seconds,
            enabled: rr.enabled,
          })),
        },
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("P1001") || error.message.includes("connect")) {
        return NextResponse.json(
          createApiError(
            "INTERNAL_ERROR",
            "Database connection failed. Please check your database configuration.",
          ),
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      createApiError(
        "INTERNAL_ERROR",
        "An error occurred while creating the task. Please try again.",
      ),
      { status: 500 }
    );
  }
}
