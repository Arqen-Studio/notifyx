import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { createApiError } from "@/lib/validation";
import { ApiResponse, generateRequestId } from "@/types/api";

const INTERVAL_LABELS: Record<string, string> = {
  P3M: "3 months before deadline",
  P1M: "1 month before deadline",
  P3W: "3 weeks before deadline",
  P2W: "2 weeks before deadline",
  P1W: "1 week before deadline",
  P3D: "3 days before deadline",
  P1D: "1 day before deadline",
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        createApiError("UNAUTHORIZED", "Invalid cron secret"),
        { status: 401 }
      );
    }

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const remindersToSend = await prisma.reminder.findMany({
      where: {
        status: "pending",
        scheduled_for: {
          gte: now,
          lte: fiveMinutesFromNow,
        },
      },
      include: {
        task: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
            user: true,
          },
        },
      },
    });

    const results = [];

    for (const reminder of remindersToSend) {
      if (reminder.task.status === "deleted" || reminder.task.status === "completed") {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "canceled",
            canceled_at: new Date(),
          },
        });
        results.push({ reminderId: reminder.id, status: "canceled", reason: "Task not active" });
        continue;
      }

      if (reminder.task.deleted_at) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "canceled",
            canceled_at: new Date(),
          },
        });
        results.push({ reminderId: reminder.id, status: "canceled", reason: "Task deleted" });
        continue;
      }

      const deadline = new Date(reminder.task.deadline_at);
      if (reminder.scheduled_for > deadline) {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "canceled",
            canceled_at: new Date(),
          },
        });
        results.push({ reminderId: reminder.id, status: "canceled", reason: "Past deadline" });
        continue;
      }

      try {
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "processing",
            attempts: { increment: 1 },
            last_attempt_at: new Date(),
          },
        });

        const intervalLabel = reminder.interval_key
          ? INTERVAL_LABELS[reminder.interval_key] || `${reminder.interval_key} before deadline`
          : "Reminder";

        const emailResult = await sendReminderEmail(
          reminder.task.user.email,
          reminder.task.title,
          deadline,
          reminder.task.notes,
          reminder.task.tags.map((tt) => ({ name: tt.tag.name })),
          intervalLabel
        );

        if (emailResult.success) {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              status: "sent",
              sent_at: new Date(),
              provider_message_id: emailResult.messageId || null,
            },
          });
          results.push({ reminderId: reminder.id, status: "sent", messageId: emailResult.messageId });
        } else {
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: {
              status: "failed",
              error: emailResult.error || "Unknown error",
            },
          });
          results.push({ reminderId: reminder.id, status: "failed", error: emailResult.error });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: "failed",
            error: errorMessage,
            attempts: { increment: 1 },
            last_attempt_at: new Date(),
          },
        });
        results.push({ reminderId: reminder.id, status: "failed", error: errorMessage });
      }
    }

    const response: ApiResponse<{ processed: number; results: typeof results }> = {
      data: {
        processed: remindersToSend.length,
        results,
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      createApiError("INTERNAL_ERROR", "An error occurred while processing reminders"),
      { status: 500 }
    );
  }
}
