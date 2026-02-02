"use client";

import Button from "@/components/button";

interface FormActionsProps {
  onCancel: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
}

export function FormActions({
  onCancel,
  onSubmit,
  loading = false,
  submitLabel = "Save Task",
  cancelLabel = "Cancel",
}: FormActionsProps) {
  return (
    <div className="flex justify-between pt-4">
      <Button variant="ghost" onClick={onCancel} disabled={loading} type="button">
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}
