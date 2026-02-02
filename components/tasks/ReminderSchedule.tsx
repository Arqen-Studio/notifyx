"use client";

import { Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Button from "@/components/button";

export interface ReminderRule {
  id: string;
  label: string;
  enabled: boolean;
}

interface ReminderScheduleProps {
  reminders: ReminderRule[];
  onToggle: (id: string) => void;
}

export function ReminderSchedule({
  reminders,
  onToggle,
}: ReminderScheduleProps) {
  return (
    <div className="space-y-4">
      <Label>Notification Schedule</Label>
      {reminders.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
        >
          <span>{r.label}</span>
          <Switch checked={r.enabled} onCheckedChange={() => onToggle(r.id)} />
        </div>
      ))}
      <Button variant="outline" className="w-full flex gap-2" type="button">
        <Plus size={16} /> Add Reminder Rule
      </Button>
    </div>
  );
}
