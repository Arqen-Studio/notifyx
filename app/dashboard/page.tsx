"use client";

import { Suspense } from "react";
import { Bell, Clock, FileText, Plus, CheckCircle2, Archive } from "lucide-react";
import Button from "@/components/button";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboard";
import { StatCard } from "@/components/common/StatCard";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

function DashboardContent() {
  const router = useRouter();
  const {
    stats,
    tasks,
    allTags,
    loading,
    filters,
    setFilters,
    handleDeleteTask,
    handleEditTask,
  } = useDashboard();

  if (loading || !stats) {
    return <LoadingSpinner message="Loading dashboard..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
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

        <DashboardFilters filters={filters} allTags={allTags} onFiltersChange={setFilters} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-10">
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
            label="Completed Tasks"
            value={`${stats.completedCount} Tasks`}
            icon={<CheckCircle2 className="text-green-500" />}
          />
          <StatCard
            label="Archived Tasks"
            value={`${stats.archivedCount} Tasks`}
            icon={<Archive className="text-slate-500" />}
          />
          <StatCard
            label="Reminders Today"
            value={`${stats.remindersSentToday} Emails`}
            icon={<Bell className="text-purple-500" />}
          />
        </div>

        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <TaskTable tasks={tasks} onDelete={handleDeleteTask} onEdit={handleEditTask} />
            <div className="md:hidden space-y-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                />
              ))}
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading dashboard..." fullScreen />}>
      <DashboardContent />
    </Suspense>
  );
}
