"use client";

import { Inbox, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState as CommonEmptyState } from "@/components/common/EmptyState";

export function EmptyState() {
  const router = useRouter();

  return (
    <CommonEmptyState
      icon={<Inbox className="w-16 h-16 text-slate-300 mb-4" />}
      title="No tasks yet"
      description="Get started by creating your first task. You can set deadlines, add tags, and configure reminders."
      actionLabel="Create Your First Task"
      onAction={() => router.push("/tasks/create")}
    />
  );
}
