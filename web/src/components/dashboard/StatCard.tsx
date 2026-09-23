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
  const variantRings = {
    default: "ring-border-secondary",
    pass: "ring-brand-20",
    fail: "ring-error/20",
    review: "ring-amber-500/20",
    brand: "ring-brand-20",
  };

  const iconBgStyles = {
    default: "bg-background-tertiary text-foreground-secondary ring-border-secondary",
    pass: "bg-brand-8 text-brand-base ring-brand-20",
    fail: "bg-error/10 text-error ring-error/20",
    review: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    brand: "bg-brand-10 text-brand-base ring-brand-20",
  };

  return (
    <div
      className={cn(
        "rounded-[6px] ring-1 ring-inset bg-background-secondary p-4 shadow-drop-sm hover:shadow-drop-md transition-shadow duration-150",
        variantRings[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-foreground-tertiary">
          {label}
        </span>
        <div className={cn("p-2 rounded-[4px] ring-1 ring-inset", iconBgStyles[variant])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-foreground-primary font-mono">{value}</div>
      {subtext && <div className="mt-1 text-[11px] text-foreground-tertiary">{subtext}</div>}
    </div>
  );
}
