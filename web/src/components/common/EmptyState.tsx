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
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[15px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]",
        className
      )}
    >
      <div className="w-12 h-12 mb-3.5 rounded-[12px] bg-teal-50 border border-teal-100 text-[#4FD1C5] flex items-center justify-center shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-[#2D3748] tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-[#718096] max-w-sm whitespace-pre-line leading-relaxed font-medium">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
