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
  const borderAccents = {
    default: "border-surface-200",
    pass: "border-l-4 border-l-emerald-500 border-surface-200",
    fail: "border-l-4 border-l-rose-500 border-surface-200",
    review: "border-l-4 border-l-amber-500 border-surface-200",
    brand: "border-l-4 border-l-industrial-500 border-surface-200",
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
        "rounded-lg border bg-surface-0 p-4 shadow-xs transition-shadow hover:shadow-sm",
        borderAccents[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xs font-mono font-semibold uppercase tracking-wider text-surface-500">
          {label}
        </span>
        <div className={cn("w-7 h-7 rounded border flex items-center justify-center", iconColors[variant])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-surface-900">
        {value}
      </div>
      {subtext && (
        <div className="mt-1 text-xs text-surface-500 font-sans flex items-center gap-1">
          {subtext}
        </div>
      )}
    </div>
  );
}
