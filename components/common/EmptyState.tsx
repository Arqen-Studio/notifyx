"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import Button from "@/components/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title = "No items found",
  description = "Get started by creating your first item.",
  actionLabel = "Create New",
  onAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          {icon}
          <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
          <p className="text-slate-500 text-center mb-6 max-w-md">{description}</p>
          {onAction && (
            <Button className="flex items-center gap-2" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
