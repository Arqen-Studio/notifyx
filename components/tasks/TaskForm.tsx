"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TagInput } from "./TagInput";
import { ReminderSchedule } from "./ReminderSchedule";
import { FormActions } from "./FormActions";

export type TaskStatus = "Active" | "Completed";

export interface ReminderRule {
  id: string;
  label: string;
  enabled: boolean;
}

export interface TaskFormData {
  title: string;
  clientId: string | null;
  deadlineDate: string;
  deadlineTime: string;
  status: TaskStatus;
  tags: string[];
  description?: string;
  reminders: ReminderRule[];
}

interface TaskFormProps {
  form: TaskFormData;
  onFieldChange: <K extends keyof TaskFormData>(
    key: K,
    value: TaskFormData[K],
  ) => void;
  onReminderToggle: (id: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function TaskForm({
  form,
  onFieldChange,
  onReminderToggle,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Save Task",
  cancelLabel = "Cancel",
}: TaskFormProps) {
  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Task Title *</Label>
            <Input
              placeholder="e.g. Financial Audit"
              value={form.title}
              onChange={(e) => onFieldChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Client / Company</Label>
            <Input
              placeholder="Select client..."
              value={form.clientId ?? ""}
              onChange={(e) => onFieldChange("clientId", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Deadline Date</Label>
              <Input
                type="date"
                value={form.deadlineDate}
                onChange={(e) => onFieldChange("deadlineDate",e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline Time</Label>
              <Input
                type="time"
                value={form.deadlineTime}
                onChange={(e) => onFieldChange("deadlineTime", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={form.status}
                onChange={(e) =>
                  onFieldChange("status", e.target.value as TaskStatus)
                }
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <TagInput
              tags={form.tags}
              onTagsChange={(tags) => onFieldChange("tags", tags)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Add any additional details, notes, or checklists here..."
              value={form.description || ""}
              onChange={(e) => onFieldChange("description", e.target.value)}
            />
          </div>

          <ReminderSchedule
            reminders={form.reminders}
            onToggle={onReminderToggle}
          />

          <FormActions
            onCancel={onCancel}
            onSubmit={onSubmit}
            loading={loading}
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
          />
        </CardContent>
      </form>
    </Card>
  );
}
