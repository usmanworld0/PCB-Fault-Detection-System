"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Activity, User, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getNotifications } from "@/lib/api/notifications";
import { RoleBadge } from "@/components/common/RoleBadge";

export function Header() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await getNotifications(true);
        if (isMounted) {
          setUnreadCount(res.unread_count);
        }
      } catch {
        // fail silently for header counter
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Operations Dashboard";
    if (path.startsWith("/inspections/")) return "Inspection Detail";
    if (path.startsWith("/inspections")) return "Inspection History";
    if (path.startsWith("/reviews/")) return "Manual Inspection Review";
    if (path.startsWith("/reviews")) return "Review Queue";
    if (path.startsWith("/analytics")) return "Quality & Trend Analytics";
    if (path.startsWith("/models")) return "Model Registry & Benchmarks";
    if (path.startsWith("/reports")) return "Quality Reports";
    if (path.startsWith("/notifications")) return "System Notifications";
    if (path.startsWith("/users")) return "User Management";
    if (path.startsWith("/audit-logs")) return "System Audit Trail";
    if (path.startsWith("/settings")) return "System Settings";
    if (path.startsWith("/profile")) return "User Profile";
    return "PCB-Vision Quality Control";
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-border-line bg-background-secondary/80 backdrop-blur-md shadow-navbar-bg">
      {/* Page Title & Status Pill */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm lg:text-base font-semibold text-foreground-primary tracking-tight">
          {getPageTitle(pathname)}
        </h1>
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-base animate-pulse" />
          System Active
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Button */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-[4px] text-foreground-secondary hover:text-foreground-primary hover:bg-background-tertiary/50 transition-colors duration-150"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-mono font-bold text-white shadow-button-sm ring-2 ring-background-secondary">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User Info */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 pl-3 border-l border-border-line hover:opacity-90 transition-opacity duration-150"
        >
          <div className="w-8 h-8 rounded-full bg-background-tertiary ring-1 ring-inset ring-border-secondary flex items-center justify-center text-foreground-secondary">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-mono font-medium text-foreground-primary leading-tight truncate max-w-[140px]">
              {user?.email}
            </div>
            <div className="text-[10px] text-foreground-tertiary capitalize">{role}</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
