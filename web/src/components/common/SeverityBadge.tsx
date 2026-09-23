import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string | undefined | null;
  className?: string;
  size?: "sm" | "md";
}

export function SeverityBadge({ severity, className, size = "md" }: SeverityBadgeProps) {
  const norm = (severity || "").toLowerCase();

  if (norm === "critical") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-semibold rounded border border-rose-300 bg-rose-50 text-rose-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
          className
        )}
      >
        <AlertCircle className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        Critical
      </span>
    );
  }

  if (norm === "moderate") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-medium rounded border border-amber-300 bg-amber-50 text-amber-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
          className
        )}
      >
        <AlertTriangle className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        Moderate
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-medium rounded border border-sky-300 bg-sky-50 text-sky-800",
        size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      <Info className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      Minor
    </span>
  );
}
