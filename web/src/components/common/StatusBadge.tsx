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
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#E6FFFA] text-[#319795]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#319795] inline-block" />
        PASS
      </span>
    );
  }

  if (norm === "FAIL") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#FFF5F5] text-[#E53E3E]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#E53E3E] inline-block" />
        FAIL
      </span>
    );
  }

  if (norm === "PENDING" || norm === "UNREVIEWED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#FFFAF0] text-[#DD6B20]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
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
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#EBF8FF] text-[#3182CE]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
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
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#FAF5FF] text-[#805AD5]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
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
        "inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded-[8px] bg-[#EDF2F7] text-[#4A5568]",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {norm || "UNKNOWN"}
    </span>
  );
}
