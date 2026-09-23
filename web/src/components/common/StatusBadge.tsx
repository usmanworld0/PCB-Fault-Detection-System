import React from "react";
import { Check, X, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string | undefined | null;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  if (norm === "PASS") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-semibold rounded border border-emerald-300 bg-emerald-50 text-emerald-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
        PASS
      </span>
    );
  }

  if (norm === "FAIL") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-semibold rounded border border-rose-300 bg-rose-50 text-rose-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
        FAIL
      </span>
    );
  }

  if (norm === "PENDING" || norm === "UNREVIEWED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-medium rounded border border-amber-300 bg-amber-50 text-amber-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
          className
        )}
      >
        <Clock className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {norm === "PENDING" ? "REVIEW REQ" : "UNREVIEWED"}
      </span>
    );
  }

  if (norm === "CONFIRMED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-medium rounded border border-sky-300 bg-sky-50 text-sky-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
          className
        )}
      >
        <ShieldCheck className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        CONFIRMED
      </span>
    );
  }

  if (norm === "OVERRIDDEN") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono font-medium rounded border border-indigo-300 bg-indigo-50 text-indigo-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
          className
        )}
      >
        <AlertTriangle className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        OVERRIDDEN
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-medium rounded border border-surface-200 bg-surface-100 text-surface-600",
        size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      {norm || "UNKNOWN"}
    </span>
  );
}
