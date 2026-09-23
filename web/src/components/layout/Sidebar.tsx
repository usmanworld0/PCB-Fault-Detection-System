"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  BarChart3,
  Cpu,
  FileText,
  Bell,
  Users,
  History,
  Settings,
  LogOut,
  Layers,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { RoleBadge } from "@/components/common/RoleBadge";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const isAdmin = role === "admin";
  const isEngineer = role === "engineer";
  const canReview = isAdmin || isEngineer;

  const mainNavItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Inspections", href: "/inspections", icon: ClipboardList },
    ...(canReview ? [{ label: "Review Queue", href: "/reviews", icon: CheckSquare }] : []),
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Models", href: "/models", icon: Cpu },
    { label: "Reports", href: "/reports", icon: FileText },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ];

  const adminNavItems = [
    { label: "Users", href: "/users", icon: Users },
    { label: "Audit Log", href: "/audit-logs", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border-line bg-background-secondary text-foreground-secondary">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border-line">
        <div className="w-8 h-8 rounded-[6px] bg-brand-10 text-brand-base ring-1 ring-inset ring-brand-20 flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-foreground-primary text-sm tracking-tight flex items-center gap-1.5">
            PCB-Vision
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-brand-10 text-brand-base ring-1 ring-inset ring-brand-20">
              QC
            </span>
          </div>
          <div className="text-[11px] text-foreground-tertiary">Inspection Platform</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono font-medium uppercase tracking-wider text-foreground-muted">
            Operations
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-[4px] text-xs font-medium transition-colors duration-150",
                    isActive
                      ? "bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20 font-medium"
                      : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary/50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono font-medium uppercase tracking-wider text-foreground-muted">
              Administration
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-[4px] text-xs font-medium transition-colors duration-150",
                      isActive
                        ? "bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20 font-medium"
                        : "text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary/50"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-border-line">
        <div className="px-3 py-2.5 mb-2 rounded-[6px] bg-background-primary ring-1 ring-inset ring-border-secondary shadow-drop-sm flex items-center justify-between">
          <div className="truncate pr-2">
            <div className="text-xs font-medium text-foreground-primary truncate font-mono">{user?.email}</div>
            <div className="mt-1">
              <RoleBadge role={role || "viewer"} />
            </div>
          </div>
          <Link
            href="/profile"
            className="text-xs text-foreground-tertiary hover:text-brand-base transition-colors duration-150 font-medium"
            title="User Profile"
          >
            Edit
          </Link>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-[4px] text-xs font-medium text-foreground-secondary hover:text-error hover:bg-error/10 hover:ring-1 hover:ring-inset hover:ring-error/20 transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
