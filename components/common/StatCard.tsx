"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6 flex justify-between items-center">
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-xl sm:text-2xl font-semibold">{value}</p>
        </div>
        <div className="ml-4">{icon}</div>
      </CardContent>
    </Card>
  );
}
