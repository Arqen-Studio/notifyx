import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiResponse, GetTasksResponse, TaskResponse } from "@/types/api";

export interface DashboardStats {
  upcomingCount: number;
  activeCount: number;
  completedCount: number;
  archivedCount: number;
  remindersSentToday: number;
}

export interface FilterState {
  status: string;
  tagId: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

async function fetchDashboardStats(tasks: TaskResponse[]): Promise<DashboardStats> {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const nonArchivedTasks = tasks.filter((task) => task.deleted_at === null);

  const upcomingTasks = nonArchivedTasks.filter((task) => {
    const deadline = new Date(task.deadline_at);
    return deadline >= now && deadline <= sevenDaysFromNow && task.status === "active";
  });

  const activeTasks = nonArchivedTasks.filter((task) => task.status === "active");
  const completedTasks = nonArchivedTasks.filter((task) => task.status === "completed");
  const archivedTasks = tasks.filter((task) => task.deleted_at !== null);

  let remindersSentToday = 0;
  try {
    const remindersResponse = await fetch("/api/v1/reminders/sent-today");
    if (remindersResponse.ok) {
      const remindersData = (await remindersResponse.json()) as ApiResponse<{ count: number }>;
      remindersSentToday = remindersData.data.count;
    }
  } catch (error) {
    console.error("Failed to fetch reminders sent today:", error);
  }

  return {
    upcomingCount: upcomingTasks.length,
    activeCount: activeTasks.length,
    completedCount: completedTasks.length,
    archivedCount: archivedTasks.length,
    remindersSentToday,
  };
}

async function fetchTasks(queryParams: string = ""): Promise<TaskResponse[]> {
  try {
    const url = queryParams ? `/api/v1/tasks?${queryParams}` : "/api/v1/tasks";
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }

    const data = (await response.json()) as ApiResponse<GetTasksResponse>;
    return data.data.tasks;
  } catch (error) {
    return [];
  }
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
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
    
    const allTasksParams = new URLSearchParams();
    allTasksParams.set("includeArchived", "true");
    const allTasksRes = await fetchTasks(allTasksParams.toString());
    
    const statsRes = await fetchDashboardStats(allTasksRes);

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
    if (searchParams?.get("refresh") === "true") {
      loadDashboard();
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
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

    if (
      !confirm(
        `Are you sure you want to delete "${taskTitle}"?\n\nThis will cancel all future reminders. This action cannot be undone.`
      )
    ) {
      return;
    }

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
      alert(
        error instanceof Error ? error.message : "Failed to delete task. Please try again."
      );
    }
  };

  const handleEditTask = (taskId: string) => {
    router.push(`/tasks/edit/${taskId}`);
  };

  return {
    stats,
    tasks,
    allTags,
    loading,
    filters,
    setFilters,
    handleDeleteTask,
    handleEditTask,
    loadDashboard,
  };
}
