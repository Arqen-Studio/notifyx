import { useState, useCallback } from "react";
import { TaskFormData, ReminderRule } from "@/components/tasks";

const DEFAULT_REMINDERS: ReminderRule[] = [
  { id: "7d", label: "7 days before deadline", enabled: false },
  { id: "1d", label: "1 day before deadline", enabled: false },
  { id: "1h", label: "1 hour before deadline", enabled: false },
];

export function useTaskForm(initialData?: Partial<TaskFormData>) {
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    clientId: null,
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
      clientId: null,
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
