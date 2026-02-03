export interface ApiResponse<T> {
  data: T;
  meta: {
    requestId: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    requestId: string;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  surname: string;
  mobile?: string;
}

export interface SignupResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    mobile: string | null;
    timezone: string;
    enabled_intervals: string[];
    created_at: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    timezone: string;
  };
}

export interface CreateTaskRequest {
  title: string;
  deadlineDate: string;
  deadlineTime?: string;
  description?: string;
  status?: "Active" | "Completed";
  tags?: string[];
  reminders?: Array<{
    id: string;
    label: string;
    enabled: boolean;
  }>;
  clientId?: string | null;
}

export interface TaskResponse {
  id: string;
  title: string;
  notes: string | null;
  deadline_at: string;
  status: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  tags: Array<{
    id: string;
    name: string;
  }>;
  reminder_rules: Array<{
    id: string;
    label: string | null;
    offset_seconds: number;
    enabled: boolean;
  }>;
  reminders?: Array<{
    id: string;
    scheduled_for: string;
    status: string;
    sent_at: string | null;
    interval_key: string | null;
  }>;
}

export interface CreateTaskResponse {
  task: TaskResponse;
}

export interface GetTasksResponse {
  tasks: TaskResponse[];
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
