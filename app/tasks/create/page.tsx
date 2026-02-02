"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import Button from "@/components/button";
import { ApiError, ApiResponse, CreateTaskRequest, CreateTaskResponse } from "@/types/api";

export type TaskStatus = "Active" | "Completed";

interface ReminderRule {
  id: string;
  label: string;
  enabled: boolean;
}

interface CreateTaskPayload {
  title: string;
  clientId: string | null;
  deadlineDate: string;
  deadlineTime: string;
  status: TaskStatus;
  tags: string[];
  description?: string;
  reminders: ReminderRule[];
}

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<CreateTaskPayload>({
    title: "",
    clientId: null,
    deadlineDate: "",
    deadlineTime: "",
    status: "Active",
    tags: [],
    description: "",
    reminders: [
      { id: "7d", label: "7 days before deadline", enabled: true },
      { id: "1d", label: "1 day before deadline", enabled: true },
      { id: "1h", label: "1 hour before deadline", enabled: false },
    ],
  });

  function updateField<K extends keyof CreateTaskPayload>(
    key: K,
    value: CreateTaskPayload[K],
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

      const requestBody: CreateTaskRequest = {
        title: form.title,
        deadlineDate: form.deadlineDate,
        deadlineTime: form.deadlineTime || undefined,
        description: form.description || undefined,
        status: form.status,
        tags: form.tags,
        reminders: form.reminders,
        clientId: form.clientId || undefined,
      };

      console.log("Creating task:", requestBody);

      const response = await fetch("/api/v1/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Task creation response status:", response.status);

      if (!response.ok) {
        let errorMessage = "An error occurred while creating the task.";
        
        try {
          const text = await response.text();
          console.log("Raw error response text:", text);
          
          if (text && text.trim().length > 0) {
            try {
              const errorData = JSON.parse(text) as ApiError;
              console.error("Task creation error response:", errorData);
              
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
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log("Task created successfully:", data);
      const successData = data as ApiResponse<CreateTaskResponse>;
      
      router.push("/dashboard");
    } catch (err) {
      console.error("Task creation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setLoading(false);
    }
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
          <h2 className="text-2xl font-semibold mb-6">Create New Task</h2>

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
                        updateField("tags", [
                          ...form.tags,
                          e.currentTarget.value,
                        ]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-full bg-slate-100"
                      >
                        {tag}
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

                <Button variant="outline" className="w-full flex gap-2">
                  <Plus size={16} /> Add Reminder Rule
                </Button>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Save Task"}
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
