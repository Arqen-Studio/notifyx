"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Clock, FileText, Plus } from "lucide-react";
import Button from "@/components/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type TaskStatus = "Active" | "Completed";

export interface Task {
  id: string;
  name: string;
  client: string;
  deadline: string;
  tags: string[];
  status: TaskStatus;
}

export interface DashboardStats {
  upcomingCount: number;
  activeCount: number;
  remindersSentToday: number;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  return {
    upcomingCount: 5,
    activeCount: 24,
    remindersSentToday: 8,
  };
}

async function fetchRecentTasks(): Promise<Task[]> {
  return [
    {
      id: "1",
      name: "Q3 VAT Return",
      client: "TechCorp",
      deadline: "2023-10-15",
      tags: ["VAT", "Urgent"],
      status: "Active",
    },
    {
      id: "2",
      name: "Annual Payroll Review",
      client: "Internal",
      deadline: "2023-11-01",
      tags: ["Payroll"],
      status: "Active",
    },
    {
      id: "3",
      name: "Client Onboarding",
      client: "StartUp LLC",
      deadline: "2023-09-30",
      tags: ["Onboarding"],
      status: "Completed",
    },
  ];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const [statsRes, tasksRes] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentTasks(),
      ]);
      setStats(statsRes);
      setTasks(tasksRes);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading || !stats) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (hidden on mobile) */}
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
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
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

        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-4">Task</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-t">
                    <td className="p-4 font-medium">
                      {task.name} – {task.client}
                    </td>
                    <td className="p-4">
                      {new Date(task.deadline).toLocaleDateString()}
                    </td>
                    <td className="p-4">{task.tags.join(" · ")}</td>
                    <td
                      className={`p-4 ${
                        task.status === "Active"
                          ? "text-green-600"
                          : "text-slate-500"
                      }`}
                    >
                      {task.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// ================= REUSABLE =================
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
