import React from "react";
import { UserRole } from "@/types/models";
import { ROLE_LABELS } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import { Shield, Wrench, Eye } from "lucide-react";

interface RoleBadgeProps {
  role: UserRole | string;
  className?: string;
  size?: "sm" | "md";
}

export function RoleBadge({ role, className, size = "md" }: RoleBadgeProps) {
  const norm = role?.toLowerCase() as UserRole;
  const label = ROLE_LABELS[norm] || (role ? role.toUpperCase() : "VIEWER");

  if (norm === "admin") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#E6FFFA] text-[#319795]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          className
        )}
      >
        <Shield className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {label}
      </span>
    );
  }

  if (norm === "engineer") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#EBF8FF] text-[#3182CE]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          className
        )}
      >
        <Wrench className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-[8px] bg-[#EDF2F7] text-[#4A5568]",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <Eye className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {label}
    </span>
  );
}
