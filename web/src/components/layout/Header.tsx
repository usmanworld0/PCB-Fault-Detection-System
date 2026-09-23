"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, HardDrive, Shield, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getNotifications } from "@/lib/api/notifications";

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

  const getBreadcrumbs = (path: string) => {
    if (path.startsWith("/dashboard")) return ["Operations", "QA Dashboard"];
    if (path.startsWith("/inspections/")) return ["Quality Control", "Inspections", "Inspection Detail"];
    if (path.startsWith("/inspections")) return ["Quality Control", "Inspection History"];
    if (path.startsWith("/reviews/")) return ["Quality Control", "Review Queue", "Engineering Review"];
    if (path.startsWith("/reviews")) return ["Quality Control", "Review Queue"];
    if (path.startsWith("/analytics")) return ["Analytics & Metrics", "Defect Analysis"];
    if (path.startsWith("/models")) return ["Analytics & Metrics", "Model Registry"];
    if (path.startsWith("/reports")) return ["Analytics & Metrics", "Quality Reports"];
    if (path.startsWith("/notifications")) return ["Operations", "Station Alerts"];
    if (path.startsWith("/users")) return ["System Administration", "Operator Directory"];
    if (path.startsWith("/audit-logs")) return ["System Administration", "Audit Trail"];
    if (path.startsWith("/settings")) return ["System Administration", "Station Config"];
    if (path.startsWith("/profile")) return ["User Account", "Profile & Security"];
    return ["PCB-Vision", "Manufacturing QA"];
  };

  const crumbs = getBreadcrumbs(pathname);

  return (
    <header className="h-13 flex-shrink-0 flex items-center justify-between px-6 border-b border-surface-200 bg-surface-0 shadow-xs">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-surface-500 font-mono">
        {crumbs.map((crumb, idx) => (
          <React.Fragment key={crumb}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-surface-400" />}
            <span
              className={
                idx === crumbs.length - 1
                  ? "font-semibold text-surface-900 font-sans text-sm"
                  : "hover:text-surface-700 transition-colors"
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right Controls & Telemetry */}
      <div className="flex items-center gap-3">
        {/* System Online Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded border border-emerald-200 bg-emerald-50/60 text-emerald-800 text-2xs font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>STATION ONLINE</span>
        </div>

        {/* Notifications Icon Button */}
        <Link
          href="/notifications"
          className="relative p-1.5 rounded border border-surface-200 text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-colors"
          title="Station Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-2xs font-mono font-bold text-white shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Link */}
        <Link
          href="/profile"
          className="flex items-center gap-2 pl-2 border-l border-surface-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded bg-surface-100 border border-surface-200 flex items-center justify-center text-surface-700 text-xs font-mono font-semibold">
            {user?.email?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-medium text-surface-900 truncate max-w-[120px] font-mono leading-tight">
              {user?.email || "Operator"}
            </div>
            <div className="text-2xs text-surface-400 font-mono capitalize leading-tight">
              {role || "viewer"}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}
