"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Bell, CheckCircle, XCircle } from "lucide-react";
import { TaskResponse } from "@/types/api";

interface TaskDetailsCardProps {
  task: TaskResponse;
}

export function TaskDetailsCard({ task }: TaskDetailsCardProps) {
  const sentCount = task.reminders?.filter((r) => r.status === "sent").length || 0;
  const pendingCount = task.reminders?.filter((r) => r.status === "pending").length || 0;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Task Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm font-medium">
                {new Date(task.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium">
                {new Date(task.updated_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            {task.status === "active" ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            )}
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-sm font-medium capitalize">
                {task.status === "active" ? "Active" : "Completed"}
              </p>
            </div>
          </div>
          {task.reminders && task.reminders.length > 0 && (
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Reminders</p>
                <p className="text-sm font-medium">
                  {sentCount} sent, {pendingCount} pending
                </p>
              </div>
            </div>
          )}
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
