import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signupSchema, formatValidationError, createApiError } from "@/lib/validation";
import { ApiResponse, SignupResponse, generateRequestId } from "@/types/api";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    try {
      await prisma.$connect();
    } catch (dbError) {
      return NextResponse.json(
        createApiError(
          "INTERNAL_ERROR",
          "Database connection failed. Please check your database configuration and ensure PostgreSQL is running.",
        ),
        { status: 500 }
      );
    }

    const body = await request.json();

    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationError(validationResult.error),
        { status: 400 }
      );
    }

    const { email, password, name, surname, mobile } = validationResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const errorResponse = createApiError(
        "CONFLICT",
        "A user with this email already exists",
        { field: "email" }
      );
      return NextResponse.json(errorResponse, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname,
        mobile: mobile || null,
        timezone: "UTC",
        enabled_intervals: ["P3M", "P1M", "P3W", "P2W", "P1W", "P3D", "P1D"],
      },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        mobile: true,
        timezone: true,
        enabled_intervals: true,
        created_at: true,
      },
    });

    const response: ApiResponse<SignupResponse> = {
      data: {
        user: {
          ...user,
          created_at: user.created_at.toISOString(),
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
        "An error occurred while creating your account. Please try again.",
      ),
      { status: 500 }
    );
  }
}
