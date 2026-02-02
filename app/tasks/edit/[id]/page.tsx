"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Clock, Bell, CheckCircle, XCircle } from "lucide-react";
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
  const [taskDetails, setTaskDetails] = useState<TaskResponse | null>(null);
  
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
        if (!taskId) {
          setError("Task ID is missing");
          setLoading(false);
          return;
        }

        console.log("Fetching task:", `/api/v1/tasks/${taskId}`);
        const response = await fetch(`/api/v1/tasks/${taskId}`);
        
        console.log("Response status:", response.status, response.ok);
        
        if (!response.ok) {
          let errorMessage = "Failed to load task";
          
          if (response.status === 404) {
            errorMessage = "Task not found";
          } else if (response.status === 401) {
            errorMessage = "You must be logged in to view this task. Please log in and try again.";
          } else {
            try {
              const errorText = await response.text();
              console.error("Error response text:", errorText);
              if (errorText) {
                try {
                  const errorData = JSON.parse(errorText);
                  errorMessage = errorData?.error?.message || `Error ${response.status}: ${response.statusText}`;
                } catch {
                  errorMessage = errorText.length < 200 ? errorText : `Error ${response.status}: ${response.statusText || "Unknown error"}`;
                }
              } else {
                errorMessage = `Error ${response.status}: ${response.statusText || "Unknown error"}`;
              }
            } catch (parseError) {
              console.error("Failed to parse error:", parseError);
              errorMessage = `Error ${response.status}: ${response.statusText || "Unknown error"}`;
            }
          }
          
          console.error("Setting error:", errorMessage);
          setError(errorMessage);
          setLoading(false);
          return;
        }

        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        let data: ApiResponse<{ task: TaskResponse }>;
        try {
          data = JSON.parse(responseText) as ApiResponse<{ task: TaskResponse }>;
        } catch (parseError) {
          console.error("Failed to parse JSON:", parseError);
          setError("Invalid response from server. Please try again.");
          setLoading(false);
          return;
        }
        
        console.log("Parsed data:", data);
        
        if (!data || !data.data || !data.data.task) {
          console.error("Invalid task data structure:", data);
          setError("Invalid task data received from server");
          setLoading(false);
          return;
        }

        const task = data.data.task;
        console.log("Task loaded successfully:", task);
        setTaskDetails(task);

        const deadline = new Date(task.deadline_at);
        const deadlineDate = deadline.toISOString().split("T")[0];
        const deadlineTime = deadline.toTimeString().slice(0, 5);

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
          tags: task.tags && Array.isArray(task.tags) ? task.tags.map((t) => t.name) : [],
          description: task.notes || "",
          reminders,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error loading task:", err);
        setError(err instanceof Error ? err.message : "Failed to load task. Please try again.");
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
          const contentType = response.headers.get("content-type");
          console.log("Response content-type:", contentType);
          
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json() as ApiError;
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
          } else {
            const text = await response.text();
            console.log("Raw error response text:", text);
            
            if (text && text.trim().length > 0) {
              try {
                const errorData = JSON.parse(text) as ApiError;
                console.error("Task update error response (parsed):", errorData);
                
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
                } else {
                  errorMessage = `Error ${response.status}: ${response.statusText || "Unknown error"}`;
                }
              }
            } else {
              errorMessage = `Error ${response.status}: ${response.statusText || "Unknown error"}`;
            }
          }
        } catch (readError) {
          console.error("Failed to read error response:", readError);
          errorMessage = `Error ${response.status}: ${response.statusText || "Network error"}`;
        }
        
        console.error("Final error message:", errorMessage);
        setError(errorMessage);
        setSaving(false);
        return;
      }

      const responseText = await response.text();
      console.log("Update response text:", responseText);
      
      if (!responseText || responseText.trim().length === 0) {
        console.warn("Empty response from server");
        router.push("/dashboard?refresh=true");
        return;
      }

      try {
        const data = JSON.parse(responseText);
        console.log("Task updated successfully:", data);
        router.push("/dashboard?refresh=true");
      } catch (parseError) {
        console.error("Failed to parse success response:", parseError);
        router.push("/dashboard?refresh=true");
      }
    } catch (err) {
      console.error("Task update error:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "An error occurred while updating the task. Please try again.";
      setError(errorMessage);
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Edit Task</h2>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {taskDetails && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Task Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="text-sm font-medium">
                        {new Date(taskDetails.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="text-sm font-medium">
                        {new Date(taskDetails.updated_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {taskDetails.status === "active" ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-sm font-medium capitalize">
                        {taskDetails.status === "active" ? "Active" : "Completed"}
                      </p>
                    </div>
                  </div>
                  {taskDetails.reminders && taskDetails.reminders.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Reminders</p>
                        <p className="text-sm font-medium">
                          {taskDetails.reminders.filter((r) => r.status === "sent").length} sent,{" "}
                          {taskDetails.reminders.filter((r) => r.status === "pending").length} pending
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {taskDetails.tags && taskDetails.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {taskDetails.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
