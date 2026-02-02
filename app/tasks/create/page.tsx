"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import Button from "@/components/button";

// ================= TYPES =================
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

// ================= COMPONENT =================
export default function CreateTaskPage() {
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

  async function handleSubmit() {
    // later: POST /api/tasks
    console.log("Create Task Payload", form);
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
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Create New Task</h2>

          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label>Task Title *</Label>
                <Input
                  placeholder="e.g., Q3 Financial Audit"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
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
                <Button variant="ghost">Cancel</Button>
                <Button onClick={handleSubmit}>Save Task</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
