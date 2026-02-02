"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Bell } from "lucide-react";
import { TaskResponse } from "@/types/api";
import { TaskActionMenu } from "./TaskActionMenu";

interface TaskCardProps {
  task: TaskResponse;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
}

export function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const sentCount = task.reminders?.filter((r) => r.status === "sent").length || 0;
  const pendingCount = task.reminders?.filter((r) => r.status === "pending").length || 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-base flex-1">{task.title}</h3>
          <TaskActionMenu
            taskId={task.id}
            onDelete={() => onDelete(task.id)}
            onEdit={() => onEdit(task.id)}
          />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600">
              {new Date(task.deadline_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {task.reminders && task.reminders.length > 0 && (
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 text-xs">
                {sentCount} sent, {pendingCount} pending
              </span>
            </div>
          )}

          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            {task.status === "active" ? (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded font-medium">
                Active
              </span>
            ) : (
              <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded font-medium">
                Completed
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
