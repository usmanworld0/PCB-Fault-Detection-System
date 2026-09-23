"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  CheckSquare,
  BarChart3,
  Cpu,
  FileSpreadsheet,
  Bell,
  Users,
  ScrollText,
  Settings,
  LogOut,
  Layers,
  Activity,
  HardDrive,
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

  const sections = [
    {
      title: "OPERATIONS",
      items: [
        { label: "QA Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "PCB Inspections", href: "/inspections", icon: ScanLine },
        ...(canReview ? [{ label: "Review Queue", href: "/reviews", icon: CheckSquare }] : []),
      ],
    },
    {
      title: "ANALYTICS & METRICS",
      items: [
        { label: "Defect Analysis", href: "/analytics", icon: BarChart3 },
        { label: "Model Registry", href: "/models", icon: Cpu },
        { label: "Quality Reports", href: "/reports", icon: FileSpreadsheet },
        { label: "Station Alerts", href: "/notifications", icon: Bell },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "SYSTEM ADMINISTRATION",
            items: [
              { label: "Operator Directory", href: "/users", icon: Users },
              { label: "Audit Trail", href: "/audit-logs", icon: ScrollText },
              { label: "Station Config", href: "/settings", icon: Settings },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-surface-200 bg-surface-0 text-surface-700 select-none">
      {/* Brand & Station Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-surface-200 bg-surface-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-industrial-900 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4 text-industrial-300" />
          </div>
          <div>
            <div className="font-bold text-xs tracking-tight text-surface-900 flex items-center gap-1.5">
              <span>PCB-VISION</span>
              <span className="text-2xs font-mono font-medium px-1 py-0.2 rounded bg-surface-100 text-surface-600 border border-surface-200">
                QA-v1
              </span>
            </div>
            <div className="text-2xs text-surface-400 font-mono">INSPECTION STATION</div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-surface-400 font-mono">
              {section.title}
            </div>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                      isActive
                        ? "bg-industrial-50 text-industrial-900 font-semibold border-l-2 border-industrial-600 rounded-l-none pl-2"
                        : "text-surface-600 hover:text-surface-900 hover:bg-surface-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive ? "text-industrial-700" : "text-surface-400"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Hardware Station Telemetry */}
      <div className="px-3 py-2 border-t border-surface-200 bg-surface-50 text-2xs font-mono text-surface-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span>STATION-01</span>
        </span>
        <span className="text-surface-400">SUPABASE LIVE</span>
      </div>

      {/* User Information & Session */}
      <div className="p-2.5 border-t border-surface-200 bg-surface-0">
        <div className="flex items-center justify-between p-1.5 rounded-md hover:bg-surface-50 transition-colors">
          <Link href="/profile" className="flex items-center gap-2 min-w-0 pr-1">
            <div className="w-7 h-7 rounded-md bg-surface-200 text-surface-700 font-mono text-xs font-semibold flex items-center justify-center flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-surface-900 truncate font-mono">
                {user?.email || "Operator"}
              </div>
              <div className="text-2xs">
                <RoleBadge role={role || "viewer"} size="sm" />
              </div>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1 rounded text-surface-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
