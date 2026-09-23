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
          "inline-flex items-center gap-1 font-mono font-semibold rounded border border-industrial-300 bg-industrial-50 text-industrial-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
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
          "inline-flex items-center gap-1 font-mono font-medium rounded border border-indigo-300 bg-indigo-50 text-indigo-800",
          size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
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
        "inline-flex items-center gap-1 font-mono font-medium rounded border border-surface-200 bg-surface-100 text-surface-700",
        size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-0.5 text-xs",
        className
      )}
    >
      <Eye className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {label}
    </span>
  );
}
