import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string | undefined | null;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const norm = (severity || "").toLowerCase();

  if (norm === "critical") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-medium px-1.5 py-0.5 rounded-[2px] text-[11px] bg-error/10 text-error ring-1 ring-inset ring-error/20",
          className
        )}
      >
        <AlertCircle className="w-3 h-3" />
        Critical
      </span>
    );
  }

  if (norm === "moderate") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-medium px-1.5 py-0.5 rounded-[2px] text-[11px] bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
          className
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        Moderate
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-medium px-1.5 py-0.5 rounded-[2px] text-[11px] bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20",
        className
      )}
    >
      <Info className="w-3 h-3" />
      Minor
    </span>
  );
}
