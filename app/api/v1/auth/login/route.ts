import { NextRequest, NextResponse } from "next/server";
import { loginSchema, formatValidationError, createApiError } from "@/lib/validation";
import { ApiResponse, LoginResponse, generateRequestId } from "@/types/api";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationError(validationResult.error),
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        surname: true,
        timezone: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        createApiError(
          "UNAUTHORIZED",
          "Invalid email or password",
        ),
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        createApiError(
          "UNAUTHORIZED",
          "Invalid email or password",
        ),
        { status: 401 }
      );
    }

    const response: ApiResponse<LoginResponse> = {
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          timezone: user.timezone,
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
        "An error occurred while logging in. Please try again.",
      ),
      { status: 500 }
    );
  }
}
