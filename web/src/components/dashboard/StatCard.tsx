import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: "default" | "pass" | "fail" | "review" | "brand";
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const topAccents = {
    default: "border-t-2 border-t-surface-300",
    pass: "border-t-2 border-t-emerald-500",
    fail: "border-t-2 border-t-rose-500",
    review: "border-t-2 border-t-amber-500",
    brand: "border-t-2 border-t-industrial-600",
  };

  const iconColors = {
    default: "bg-surface-100 text-surface-600 border-surface-200",
    pass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    fail: "bg-rose-50 text-rose-700 border-rose-200",
    review: "bg-amber-50 text-amber-700 border-amber-200",
    brand: "bg-industrial-50 text-industrial-700 border-industrial-200",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-surface-200/90 bg-surface-0 p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between",
        topAccents[variant]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500 line-clamp-1">
          {label}
        </span>
        <div
          className={cn(
            "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs",
            iconColors[variant]
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2.5">
        <div className="text-2xl font-bold font-mono tracking-tight text-surface-900">
          {value}
        </div>
        {subtext && (
          <div className="mt-1 text-xs text-surface-500 truncate font-sans">
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
