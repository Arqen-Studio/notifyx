import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createApiError } from "@/lib/validation";
import { ApiResponse, generateRequestId } from "@/types/api";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError("UNAUTHORIZED", "You must be logged in to view tags"),
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const tags = await prisma.tag.findMany({
      where: { user_id: userId },
      include: {
        tasks: {
          where: {
            task: {
              deleted_at: null,
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const response: ApiResponse<{ tags: Array<{ id: string; name: string; taskCount: number }> }> = {
      data: {
        tags: tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          taskCount: tag.tasks.length,
        })),
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      createApiError("INTERNAL_ERROR", "An error occurred while fetching tags"),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError("UNAUTHORIZED", "You must be logged in to delete tags"),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json(
        createApiError("VALIDATION_ERROR", "Tag ID is required"),
        { status: 400 }
      );
    }

    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        user_id: userId,
      },
    });

    if (!tag) {
      return NextResponse.json(
        createApiError("NOT_FOUND", "Tag not found"),
        { status: 404 }
      );
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    const response: ApiResponse<{ message: string }> = {
      data: {
        message: "Tag deleted successfully",
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      createApiError("INTERNAL_ERROR", "An error occurred while deleting the tag"),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        createApiError("UNAUTHORIZED", "You must be logged in to update tags"),
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { tagId, name } = body;

    if (!tagId || !name || !name.trim()) {
      return NextResponse.json(
        createApiError("VALIDATION_ERROR", "Tag ID and name are required"),
        { status: 400 }
      );
    }

    const existingTag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        user_id: userId,
      },
    });

    if (!existingTag) {
      return NextResponse.json(
        createApiError("NOT_FOUND", "Tag not found"),
        { status: 404 }
      );
    }

    const duplicateTag = await prisma.tag.findFirst({
      where: {
        user_id: userId,
        name: name.trim(),
        id: { not: tagId },
      },
    });

    if (duplicateTag) {
      return NextResponse.json(
        createApiError("CONFLICT", "A tag with this name already exists"),
        { status: 409 }
      );
    }

    const updatedTag = await prisma.tag.update({
      where: { id: tagId },
      data: { name: name.trim() },
    });

    const response: ApiResponse<{ tag: { id: string; name: string } }> = {
      data: {
        tag: {
          id: updatedTag.id,
          name: updatedTag.name,
        },
      },
      meta: {
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      createApiError("INTERNAL_ERROR", "An error occurred while updating the tag"),
      { status: 500 }
    );
  }
}
