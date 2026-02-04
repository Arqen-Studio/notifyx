import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ApiResponse, generateRequestId } from "@/types/api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to view reminders",
          },
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const remindersSentToday = await prisma.reminder.count({
      where: {
        user_id: userId,
        status: "sent",
        sent_at: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const response: ApiResponse<{ count: number }> = {
      data: {
        count: remindersSentToday,
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while fetching reminders. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
