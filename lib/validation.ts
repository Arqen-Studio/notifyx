import { z } from "zod";
import { ApiError, ErrorCode, generateRequestId } from "@/types/api";

export const signupSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long"),
  surname: z
    .string()
    .min(1, "Surname is required")
    .max(100, "Surname is too long"),
  mobile: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 10,
      "Mobile number must be at least 10 characters"
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title is too long"),
  deadlineDate: z
    .string()
    .min(1, "Deadline date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  deadlineTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  description: z.string().optional(),
  status: z.enum(["Active", "Completed"]).default("Active"),
  tags: z.array(z.string().min(1).max(50)).default([]),
  reminders: z.array(z.object({
    id: z.string(),
    label: z.string(),
    enabled: z.boolean(),
  })).default([]),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Task title is too long")
    .optional(),
  deadlineDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(),
  deadlineTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Invalid time format")
    .optional(),
  description: z.string().optional(),
  status: z.enum(["Active", "Completed"]).optional(),
  tags: z.array(z.string().min(1).max(50)).optional(),
  reminders: z.array(z.object({
    id: z.string(),
    label: z.string(),
    enabled: z.boolean(),
  })).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export function formatValidationError(
  error: z.ZodError,
  code: ErrorCode = "VALIDATION_ERROR"
): ApiError {
  const details: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    details[path] = err.message;
  });

  return {
    error: {
      code,
      message: "Validation failed",
      details,
    },
    meta: {
      requestId: generateRequestId(),
    },
  };
}

export function createApiError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId: generateRequestId(),
    },
  };
}
