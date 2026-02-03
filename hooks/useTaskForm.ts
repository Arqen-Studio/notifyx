import { useState, useCallback } from "react";
import { TaskFormData, ReminderRule } from "@/components/tasks/TaskForm";

const DEFAULT_REMINDERS: ReminderRule[] = [
  { id: "P3M", label: "3 months before deadline", enabled: true },
  { id: "P1M", label: "1 month before deadline", enabled: true },
  { id: "P3W", label: "3 weeks before deadline", enabled: true },
  { id: "P2W", label: "2 weeks before deadline", enabled: true },
  { id: "P1W", label: "1 week before deadline", enabled: true },
  { id: "P3D", label: "3 days before deadline", enabled: true },
  { id: "P1D", label: "1 day before deadline", enabled: true },
];

export function useTaskForm(initialData?: Partial<TaskFormData>) {
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    deadlineDate: "",
    deadlineTime: "",
    status: "Active",
    tags: [],
    description: "",
    reminders: DEFAULT_REMINDERS,
    ...initialData,
  });

  const updateField = useCallback(
    <K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleReminder = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      reminders: prev.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  }, []);

  const resetForm = useCallback((data?: Partial<TaskFormData>) => {
    setForm({
      title: "",
      deadlineDate: "",
      deadlineTime: "",
      status: "Active",
      tags: [],
      description: "",
      reminders: DEFAULT_REMINDERS,
      ...data,
    });
  }, []);

  return {
    form,
    updateField,
    toggleReminder,
    resetForm,
    setForm,
  };
}
