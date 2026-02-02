"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/button";
import {
  TaskForm,
  TaskDetailsCard,
  ErrorAlert,
  type TaskFormData,
  type ReminderRule,
} from "@/components/tasks";
import { useTaskForm } from "@/hooks/useTaskForm";
import { parseApiError } from "@/lib/api-error-handler";
import { LoadingSpinner } from "@/components/common";
import { ApiResponse, TaskResponse } from "@/types/api";

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskDetails, setTaskDetails] = useState<TaskResponse | null>(null);

  const { form, updateField, toggleReminder, setForm } = useTaskForm();

  useEffect(() => {
    async function loadTask() {
      try {
        if (!taskId) {
          setError("Task ID is missing");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/v1/tasks/${taskId}`);

        if (!response.ok) {
          let errorMessage = "Failed to load task";

          if (response.status === 404) {
            errorMessage = "Task not found";
          } else if (response.status === 401) {
            errorMessage =
              "You must be logged in to view this task. Please log in and try again.";
          } else {
            errorMessage = await parseApiError(response);
          }

          setError(errorMessage);
          setLoading(false);
          return;
        }

        const responseText = await response.text();

        let data: ApiResponse<{ task: TaskResponse }>;
        try {
          data = JSON.parse(responseText) as ApiResponse<{
            task: TaskResponse;
          }>;
        } catch (parseError) {
          setError("Invalid response from server. Please try again.");
          setLoading(false);
          return;
        }

        if (!data || !data.data || !data.data.task) {
          setError("Invalid task data received from server");
          setLoading(false);
          return;
        }

        const task = data.data.task;
        setTaskDetails(task);

        const deadline = new Date(task.deadline_at);
        
        // Use local date methods to avoid timezone issues
        const year = deadline.getFullYear();
        const month = String(deadline.getMonth() + 1).padStart(2, "0");
        const day = String(deadline.getDate()).padStart(2, "0");
        const deadlineDate = `${year}-${month}-${day}`;
        
        const hours = String(deadline.getHours()).padStart(2, "0");
        const minutes = String(deadline.getMinutes()).padStart(2, "0");
        const deadlineTime = `${hours}:${minutes}`;

        const reminders: ReminderRule[] = [
          { id: "7d", label: "7 days before deadline", enabled: false },
          { id: "1d", label: "1 day before deadline", enabled: false },
          { id: "1h", label: "1 hour before deadline", enabled: false },
        ];

        if (task.reminder_rules && Array.isArray(task.reminder_rules)) {
          task.reminder_rules.forEach((rr) => {
            const offsetDays = rr.offset_seconds / (24 * 60 * 60);
            if (offsetDays === 7) {
              const reminder = reminders.find((r) => r.id === "7d");
              if (reminder) reminder.enabled = rr.enabled;
            } else if (offsetDays === 1) {
              const reminder = reminders.find((r) => r.id === "1d");
              if (reminder) reminder.enabled = rr.enabled;
            } else if (rr.offset_seconds === 3600) {
              const reminder = reminders.find((r) => r.id === "1h");
              if (reminder) reminder.enabled = rr.enabled;
            }
          });
        }

        setForm({
          title: task.title || "",
          clientId: null,
          deadlineDate,
          deadlineTime,
          status: task.status === "active" ? "Active" : "Completed",
          tags:
            task.tags && Array.isArray(task.tags)
              ? task.tags.map((t) => t.name)
              : [],
          description: task.notes || "",
          reminders,
        });
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load task. Please try again.",
        );
        setLoading(false);
      }
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);


  async function handleSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
    }

    setError(null);
    setSaving(true);

    try {
      if (!form.title.trim()) {
        setError("Task title is required");
        setSaving(false);
        return;
      }

      if (!form.deadlineDate) {
        setError("Deadline date is required");
        setSaving(false);
        return;
      }

      const requestBody = {
        title: form.title,
        deadlineDate: form.deadlineDate,
        deadlineTime: form.deadlineTime || undefined,
        description: form.description || undefined,
        status: form.status,
        tags: form.tags,
        reminders: form.reminders,
        clientId: form.clientId || undefined,
      };

      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorMessage = await parseApiError(response);
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const responseText = await response.text();

      if (!responseText || responseText.trim().length === 0) {
        router.push("/dashboard?refresh=true");
        return;
      }

      try {
        const data = JSON.parse(responseText);
        router.push("/dashboard?refresh=true");
      } catch (parseError) {
        router.push("/dashboard?refresh=true");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while updating the task. Please try again.";
      setError(errorMessage);
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading task..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Edit Task</h2>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>

            <ErrorAlert message={error} />

            {taskDetails && <TaskDetailsCard task={taskDetails} />}

            <TaskForm
              form={form}
              onFieldChange={updateField}
              onReminderToggle={toggleReminder}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              loading={saving}
              submitLabel={saving ? "Saving..." : "Save Changes"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
