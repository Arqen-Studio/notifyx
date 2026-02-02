"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import Button from "@/components/button";
import { ApiError, ApiResponse, TaskResponse } from "@/types/api";

export type TaskStatus = "Active" | "Completed";

interface ReminderRule {
  id: string;
  label: string;
  enabled: boolean;
}

interface EditTaskPayload {
  title: string;
  clientId: string | null;
  deadlineDate: string;
  deadlineTime: string;
  status: TaskStatus;
  tags: string[];
  description?: string;
  reminders: ReminderRule[];
}

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<EditTaskPayload>({
    title: "",
    clientId: null,
    deadlineDate: "",
    deadlineTime: "",
    status: "Active",
    tags: [],
    description: "",
    reminders: [
      { id: "7d", label: "7 days before deadline", enabled: false },
      { id: "1d", label: "1 day before deadline", enabled: false },
      { id: "1h", label: "1 hour before deadline", enabled: false },
    ],
  });

  useEffect(() => {
    async function loadTask() {
      try {
        const response = await fetch(`/api/v1/tasks/${taskId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Task not found");
            return;
          }
          throw new Error("Failed to load task");
        }

        const data = await response.json() as ApiResponse<{ task: TaskResponse }>;
        const task = data.data.task;

        const deadline = new Date(task.deadline_at);
        const deadlineDate = deadline.toISOString().split("T")[0];
        const deadlineTime = deadline.toTimeString().slice(0, 5);

        const reminders: ReminderRule[] = [
          { id: "7d", label: "7 days before deadline", enabled: false },
          { id: "1d", label: "1 day before deadline", enabled: false },
          { id: "1h", label: "1 hour before deadline", enabled: false },
        ];

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

        setForm({
          title: task.title,
          clientId: null,
          deadlineDate,
          deadlineTime,
          status: task.status === "active" ? "Active" : "Completed",
          tags: task.tags.map((t) => t.name),
          description: task.notes || "",
          reminders,
        });
      } catch (err) {
        console.error("Error loading task:", err);
        setError("Failed to load task. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  function updateField<K extends keyof EditTaskPayload>(
    key: K,
    value: EditTaskPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleReminder(id: string) {
    setForm((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r,
      ),
    }));
  }

  function removeTag(tagToRemove: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }

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

      console.log("Updating task:", requestBody);

      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Task update response status:", response.status);

      if (!response.ok) {
        let errorMessage = "An error occurred while updating the task.";
        
        try {
          const text = await response.text();
          console.log("Raw error response text:", text);
          
          if (text && text.trim().length > 0) {
            try {
              const errorData = JSON.parse(text) as ApiError;
              console.error("Task update error response:", errorData);
              
              if (errorData?.error?.message) {
                errorMessage = errorData.error.message;
              }
              
              if (errorData?.error?.details && typeof errorData.error.details === "object") {
                const details = errorData.error.details;
                const firstError = Object.values(details)[0];
                if (typeof firstError === "string") {
                  errorMessage = firstError;
                }
              }
            } catch (jsonParseError) {
              console.error("Failed to parse JSON from error response:", jsonParseError);
              if (text.length < 200) {
                errorMessage = text;
              }
            }
          }
        } catch (readError) {
          console.error("Failed to read error response:", readError);
          errorMessage = `Error ${response.status}: ${response.statusText || "Network error"}`;
        }
        
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const data = await response.json();
      console.log("Task updated successfully:", data);
      
      router.push("/dashboard");
    } catch (err) {
      console.error("Task update error:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading task...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r p-6 flex-col justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-8">DeadlineGuard</h1>
          <nav className="space-y-3 text-sm">
            <p className="text-slate-500">Dashboard</p>
            <p className="font-medium text-blue-600">All Tasks</p>
            <p className="text-slate-500">Tags</p>
            <p className="text-slate-500">Archive</p>
          </nav>
        </div>
        <div className="text-sm text-slate-500">
          John Consultant
          <br />
          john@consulting.com
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Edit Task</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Card>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label>Task Title *</Label>
                  <Input
                    placeholder="e.g., Q3 Financial Audit"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    required
                  />
                </div>

                {/* Client */}
                <div className="space-y-2">
                  <Label>Client / Company</Label>
                  <Input
                    placeholder="Select client..."
                    value={form.clientId ?? ""}
                    onChange={(e) => updateField("clientId", e.target.value)}
                  />
                </div>

                {/* Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deadline Date</Label>
                    <Input
                      type="date"
                      value={form.deadlineDate}
                      onChange={(e) =>
                        updateField("deadlineDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline Time</Label>
                    <Input
                      type="time"
                      value={form.deadlineTime}
                      onChange={(e) =>
                        updateField("deadlineTime", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Status & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      className="w-full border rounded-md h-10 px-3"
                      value={form.status}
                      onChange={(e) =>
                        updateField("status", e.target.value as TaskStatus)
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority & Tags</Label>
                    <Input
                      placeholder="Type and press enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !form.tags.includes(value)) {
                            updateField("tags", [...form.tags, value]);
                          }
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-slate-100 flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Add any additional details, notes, or checklists here..."
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                  />
                </div>

                {/* Notifications */}
                <div className="space-y-4">
                  <Label>Notification Schedule</Label>
                  {form.reminders.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                    >
                      <span>{r.label}</span>
                      <Switch
                        checked={r.enabled}
                        onCheckedChange={() => toggleReminder(r.id)}
                      />
                    </div>
                  ))}

                  <Button variant="outline" className="w-full flex gap-2" type="button">
                    <Plus size={16} /> Add Reminder Rule
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    disabled={saving}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
