import { PrismaClient, Prisma } from "@prisma/client";

type PrismaTransaction = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

const STANDARD_INTERVALS: Record<string, number> = {
  P3M: 3 * 30 * 24 * 60 * 60,
  P1M: 1 * 30 * 24 * 60 * 60,
  P3W: 3 * 7 * 24 * 60 * 60,
  P2W: 2 * 7 * 24 * 60 * 60,
  P1W: 1 * 7 * 24 * 60 * 60,
  P3D: 3 * 24 * 60 * 60,
  P1D: 1 * 24 * 60 * 60,
};

export async function scheduleRemindersForTask(
  prisma: PrismaClient | PrismaTransaction,
  taskId: string,
  userId: string,
  deadlineAt: Date,
  enabledIntervals: string[] = ["P3M", "P1M", "P3W", "P2W", "P1W", "P3D", "P1D"]
) {
  const now = new Date();
  const remindersToCreate = [];

  for (const intervalKey of enabledIntervals) {
    const offsetSeconds = STANDARD_INTERVALS[intervalKey];
    if (!offsetSeconds) continue;

    const scheduledFor = new Date(deadlineAt.getTime() - offsetSeconds * 1000);

    if (scheduledFor > now && scheduledFor < deadlineAt) {
      remindersToCreate.push({
        user_id: userId,
        task_id: taskId,
        interval_key: intervalKey,
        offset_seconds: offsetSeconds,
        source: "standard",
        scheduled_for: scheduledFor,
        status: "pending",
      });
    }
  }

  if (remindersToCreate.length > 0) {
    await prisma.reminder.createMany({
      data: remindersToCreate,
      skipDuplicates: true,
    });
  }
}

export async function cancelFutureRemindersForTask(
  prisma: PrismaClient | PrismaTransaction,
  taskId: string
) {
  await prisma.reminder.updateMany({
    where: {
      task_id: taskId,
      status: "pending",
      scheduled_for: {
        gt: new Date(),
      },
    },
    data: {
      status: "canceled",
      canceled_at: new Date(),
    },
  });
}

export async function rescheduleRemindersForTask(
  prisma: PrismaClient | PrismaTransaction,
  taskId: string,
  userId: string,
  deadlineAt: Date,
  enabledIntervals: string[]
) {
  await cancelFutureRemindersForTask(prisma, taskId);
  await scheduleRemindersForTask(prisma, taskId, userId, deadlineAt, enabledIntervals);
}
