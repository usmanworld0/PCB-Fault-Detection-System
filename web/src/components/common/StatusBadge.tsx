import React from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
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
          "inline-flex items-center gap-1.5 font-mono font-medium rounded-[2px] bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20",
          size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs tracking-wide",
          className
        )}
      >
        <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        PASS
      </span>
    );
  }

  if (norm === "FAIL") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono font-medium rounded-[2px] bg-error/10 text-error ring-1 ring-inset ring-error/20",
          size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs tracking-wide",
          className
        )}
      >
        <XCircle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        FAIL
      </span>
    );
  }

  if (norm === "PENDING" || norm === "UNREVIEWED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono font-medium rounded-[2px] bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
          size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs tracking-wide",
          className
        )}
      >
        <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        {norm === "PENDING" ? "REVIEW REQ" : "UNREVIEWED"}
      </span>
    );
  }

  if (norm === "CONFIRMED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono font-medium rounded-[2px] bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20",
          size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs tracking-wide",
          className
        )}
      >
        <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        CONFIRMED
      </span>
    );
  }

  if (norm === "OVERRIDDEN") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono font-medium rounded-[2px] bg-purple-500/10 text-purple-400 ring-1 ring-inset ring-purple-500/20",
          size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs tracking-wide",
          className
        )}
      >
        <AlertTriangle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        OVERRIDDEN
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-medium rounded-[2px] bg-background-tertiary text-foreground-tertiary ring-1 ring-inset ring-border-secondary",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      {norm || "UNKNOWN"}
    </span>
  );
}
