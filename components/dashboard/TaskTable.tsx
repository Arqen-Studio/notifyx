"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { TaskResponse } from "@/types/api";
import { TaskActionMenu } from "./TaskActionMenu";
import { getTagColors } from "@/lib/tagColors";

interface TaskTableProps {
  tasks: TaskResponse[];
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
}

export function TaskTable({ tasks, onDelete, onEdit }: TaskTableProps) {
  return (
    <div className="hidden md:block">
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-4">Task</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Reminders</th>
                <th className="p-4 text-center">Tags</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskTableRow
                  key={task.id}
                  task={task}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function TaskTableRow({
  task,
  onDelete,
  onEdit,
}: {
  task: TaskResponse;
  onDelete: (taskId: string) => void;
  onEdit: (taskId: string) => void;
}) {
  const sentCount = task.reminders?.filter((r) => r.status === "sent").length || 0;
  const pendingCount = task.reminders?.filter((r) => r.status === "pending").length || 0;

  return (
    <tr className="border-t hover:bg-slate-50">
      <td className="p-4 font-medium">{task.title}</td>
      <td className="p-4">
        <div className="space-y-1">
          <div>{new Date(task.deadline_at).toLocaleDateString()}</div>
          <div className="text-xs text-slate-500">
            {new Date(task.deadline_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </td>
      <td className="p-4">
        {task.reminders && task.reminders.length > 0 ? (
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Bell className="w-3 h-3" />
            <span>
              {sentCount} sent, {pendingCount} pending
            </span>
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="p-4">
        {task.tags.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 max-w-[200px] mx-auto">
            {task.tags.map((tag) => {
              const tagColorClasses = getTagColors(tag.name);
              return (
                <span
                  key={tag.id}
                  className={`px-2 py-1 text-xs rounded-full border truncate text-center ${tagColorClasses}`}
                  title={tag.name}
                >
                  {tag.name}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-slate-400 text-center block">—</span>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {task.status === "active" ? (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
              Completed
            </span>
          )}
        </div>
      </td>
      <td className="p-4 text-right">
        <TaskActionMenu
          taskId={task.id}
          onDelete={() => onDelete(task.id)}
          onEdit={() => onEdit(task.id)}
        />
      </td>
    </tr>
  );
}
