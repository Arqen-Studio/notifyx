"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  Clock,
  FileText,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Inbox,
} from "lucide-react";
import Button from "@/components/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiResponse, GetTasksResponse, TaskResponse, ApiError } from "@/types/api";

export type TaskStatus = "Active" | "Completed";

export interface Task {
  id: string;
  name: string;
  deadline: string;
  tags: string[];
  status: TaskStatus;
}

export interface DashboardStats {
  upcomingCount: number;
  activeCount: number;
  remindersSentToday: number;
}

async function fetchDashboardStats(tasks: TaskResponse[]): Promise<DashboardStats> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcomingTasks = tasks.filter((task) => {
    const deadline = new Date(task.deadline_at);
    return deadline >= now && deadline <= sevenDaysFromNow && task.status === "active";
  });

  const activeTasks = tasks.filter((task) => task.status === "active");

  return {
    upcomingCount: upcomingTasks.length,
    activeCount: activeTasks.length,
    remindersSentToday: 0, // TODO: Implement when reminders are sent
  };
}

async function fetchTasks(queryParams: string = ""): Promise<TaskResponse[]> {
  try {
    const url = queryParams ? `/api/v1/tasks?${queryParams}` : "/api/v1/tasks";
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }

    const data = await response.json() as ApiResponse<GetTasksResponse>;
    return data.data.tasks;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    tagId: "",
    search: "",
    sortBy: "deadline",
    sortOrder: "asc",
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const loadDashboard = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.set("status", filters.status);
    if (filters.tagId) queryParams.set("tagId", filters.tagId);
    if (filters.search) queryParams.set("search", filters.search);
    queryParams.set("sortBy", filters.sortBy);
    queryParams.set("sortOrder", filters.sortOrder);

    const tasksRes = await fetchTasks(queryParams.toString());
    const statsRes = await fetchDashboardStats(tasksRes);
    
    const uniqueTags = new Map<string, { id: string; name: string }>();
    tasksRes.forEach((task) => {
      task.tags.forEach((tag) => {
        if (!uniqueTags.has(tag.id)) {
          uniqueTags.set(tag.id, tag);
        }
      });
    });
    setAllTags(Array.from(uniqueTags.values()));

    setTasks(tasksRes);
    setStats(statsRes);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, [filters]);

  useEffect(() => {
    if (searchParams.get("refresh") === "true") {
      loadDashboard();
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams]);

  useEffect(() => {
    const handleFocus = () => {
      loadDashboard();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [filters]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [filters]);

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const taskTitle = task?.title || "this task";
    
    if (!confirm(`Are you sure you want to delete "${taskTitle}"?\n\nThis will cancel all future reminders. This action cannot be undone.`)) {
      return;
    }

    setDeleting(taskId);
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || "Failed to delete task");
      }

      await loadDashboard();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert(error instanceof Error ? error.message : "Failed to delete task. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r p-6 flex-col justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-8">DeadlineGuard</h1>
          <nav className="space-y-3 text-sm">
            <p className="font-medium text-blue-600">Dashboard</p>
            <p className="text-slate-500">All Tasks</p>
            <p className="text-slate-500">Tags</p>
            <p className="text-slate-500">Archive</p>
          </nav>
        </div>
        <div className="text-sm text-slate-500">
          John Consultant
          <br />
          john@consulting.com
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <Button
            className="flex items-center gap-2 w-full sm:w-auto"
            onClick={() => router.push("/tasks/create")}
          >
            <Plus size={16} />
            Create Task
          </Button>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f]"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filters.tagId}
              onChange={(e) => setFilters({ ...filters, tagId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f]"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                setFilters({ ...filters, sortBy, sortOrder });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f064f]"
            >
              <option value="deadline-asc">Deadline: Soonest First</option>
              <option value="deadline-desc">Deadline: Latest First</option>
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            label="Upcoming in 7 Days"
            value={`${stats.upcomingCount} Tasks`}
            icon={<Clock className="text-red-400" />}
          />
          <StatCard
            label="Active Obligations"
            value={`${stats.activeCount} Tasks`}
            icon={<FileText className="text-blue-500" />}
          />
          <StatCard
            label="Reminders Sent Today"
            value={`${stats.remindersSentToday} Emails`}
            icon={<Bell className="text-green-500" />}
          />
        </div>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <Inbox className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No tasks yet
                </h3>
                <p className="text-slate-500 text-center mb-6 max-w-md">
                  Get started by creating your first task. You can set deadlines, add tags, and configure reminders.
                </p>
                <Button
                  className="flex items-center gap-2"
                  onClick={() => router.push("/tasks/create")}
                >
                  <Plus size={16} />
                  Create Your First Task
                </Button>
              </div>
            ) : (
              <table className="min-w-[700px] w-full text-sm">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="p-4">Task</th>
                    <th className="p-4">Deadline</th>
                    <th className="p-4">Tags</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-t hover:bg-slate-50">
                      <td className="p-4 font-medium">
                        {task.title}
                      </td>
                      <td className="p-4">
                        {new Date(task.deadline_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {task.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className={`p-4 ${
                          task.status === "active"
                            ? "text-green-600 font-medium"
                            : "text-slate-500"
                        }`}
                      >
                        {task.status === "active" ? "Active" : "Completed"}
                      </td>
                      <td className="p-4 text-right">
                        <TaskActionMenu 
                          taskId={task.id} 
                          onDelete={() => handleDeleteTask(task.id)}
                          onEdit={() => router.push(`/tasks/edit/${task.id}`)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function TaskActionMenu({ 
  taskId, 
  onDelete,
  onEdit 
}: { 
  taskId: string; 
  onDelete: () => void;
  onEdit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      router.push(`/tasks/edit/${taskId}`);
    }
    setOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        className="p-2 rounded hover:bg-slate-100 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-label="Task actions"
        type="button"
      >
        <MoreVertical size={18} className="text-gray-600" />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col py-1 z-50 min-w-[140px] right-0 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 w-full text-left transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            type="button"
          >
            <Edit size={16} className="text-blue-500" />
            <span>Edit Task</span>
          </button>
          <button
            className="px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600 w-full text-left transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            type="button"
          >
            <Trash2 size={16} />
            <span>Delete Task</span>
          </button>
        </div>
      )}
    </div>
  );
}
