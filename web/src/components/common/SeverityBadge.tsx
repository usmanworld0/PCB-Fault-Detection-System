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
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#FFF5F5] text-[#E53E3E]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
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
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#FFFAF0] text-[#DD6B20]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
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
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#EBF8FF] text-[#3182CE]",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Info className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      Minor
    </span>
  );
}
