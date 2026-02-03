"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
    </div>
  );
}
