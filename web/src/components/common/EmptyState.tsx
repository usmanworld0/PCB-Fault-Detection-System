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
        "flex flex-col items-center justify-center p-12 text-center rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary shadow-drop-sm",
        className
      )}
    >
      <div className="w-12 h-12 mb-4 rounded-full bg-background-tertiary ring-1 ring-inset ring-border-secondary text-foreground-tertiary flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-foreground-tertiary max-w-sm whitespace-pre-line leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
