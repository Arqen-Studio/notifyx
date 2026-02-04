"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Button from "@/components/button";
import { TaskForm, type TaskFormData } from "@/components/tasks/TaskForm";
import { ErrorAlert } from "@/components/tasks/ErrorAlert";
import { useTaskForm } from "@/hooks/useTaskForm";
import { parseApiError } from "@/lib/api-error-handler";
import {
  ApiResponse,
  CreateTaskRequest,
  CreateTaskResponse,
} from "@/types/api";

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { form, updateField, toggleReminder } = useTaskForm();

  async function handleSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }

    setError(null);
    setLoading(true);

    try {
      if (!form.title.trim()) {
        setError("Task title is required");
        setLoading(false);
        return;
      }

      if (!form.deadlineDate) {
        setError("Deadline date is required");
        setLoading(false);
        return;
      }

      let deadlineDateUTC = form.deadlineDate;
      let deadlineTimeUTC = form.deadlineTime;
      if (form.deadlineDate && form.deadlineTime) {
        const localDate = new Date(`${form.deadlineDate}T${form.deadlineTime}`);
        const utcYear = localDate.getUTCFullYear();
        const utcMonth = String(localDate.getUTCMonth() + 1).padStart(2, "0");
        const utcDay = String(localDate.getUTCDate()).padStart(2, "0");
        const utcHours = String(localDate.getUTCHours()).padStart(2, "0");
        const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, "0");
        
        deadlineDateUTC = `${utcYear}-${utcMonth}-${utcDay}`;
        deadlineTimeUTC = `${utcHours}:${utcMinutes}`;
      }

      const requestBody: CreateTaskRequest = {
        title: form.title,
        deadlineDate: deadlineDateUTC,
        deadlineTime: deadlineTimeUTC || undefined,
        description: form.description || undefined,
        status: form.status,
        tags: form.tags,
        reminders: form.reminders,
      };

      const response = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      await response.json();

      router.push("/dashboard?refresh=true");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Create New Task</h2>

            <ErrorAlert message={error} />

            <TaskForm
              form={form}
              onFieldChange={updateField}
              onReminderToggle={toggleReminder}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              loading={loading}
              submitLabel={loading ? "Creating..." : "Save Task"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
