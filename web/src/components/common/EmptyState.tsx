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
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-surface-200/90 bg-surface-0 shadow-xs",
        className
      )}
    >
      <div className="w-12 h-12 mb-3.5 rounded-xl bg-surface-100 border border-surface-200 text-surface-400 flex items-center justify-center shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-surface-900 tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-surface-500 max-w-sm whitespace-pre-line leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
