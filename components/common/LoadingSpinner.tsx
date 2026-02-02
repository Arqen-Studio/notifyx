"use client";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message = "Loading...", fullScreen = false }: LoadingSpinnerProps) {
  const containerClass = fullScreen
    ? "min-h-screen bg-slate-50 flex items-center justify-center"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#4f064f] rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">{message}</p>
      </div>
    </div>
  );
}
