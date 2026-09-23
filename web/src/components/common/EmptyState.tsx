import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center rounded-lg border border-surface-200 bg-surface-0 shadow-xs",
        className
      )}
    >
      <div className="w-10 h-10 mb-3 rounded-md bg-surface-100 border border-surface-200 text-surface-500 flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-surface-900 tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-surface-500 max-w-sm whitespace-pre-line leading-normal">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
