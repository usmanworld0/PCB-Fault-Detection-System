import React from "react";
import { UserRole } from "@/types/models";
import { ROLE_LABELS } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, Eye } from "lucide-react";

interface RoleBadgeProps {
  role: UserRole | string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const norm = role?.toLowerCase() as UserRole;
  const label = ROLE_LABELS[norm] || role.toUpperCase();

  if (norm === "admin") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-brand-10 text-brand-base ring-1 ring-inset ring-brand-20",
          className
        )}
      >
        <ShieldAlert className="w-3 h-3" />
        {label}
      </span>
    );
  }

  if (norm === "engineer") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20",
          className
        )}
      >
        <ShieldCheck className="w-3 h-3" />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-background-tertiary text-foreground-secondary ring-1 ring-inset ring-border-secondary",
        className
      )}
    >
      <Eye className="w-3 h-3" />
      {label}
    </span>
  );
}
