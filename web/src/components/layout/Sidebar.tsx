"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  Cpu,
  FileSpreadsheet,
  Bell,
  Users,
  LogOut,
  Layers,
  Activity,
  HardDrive,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { RoleBadge } from "@/components/common/RoleBadge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();

  const isAdmin = role === "admin";

  const sections = [
    {
      title: "OPERATIONS",
      items: [
        { label: "QA Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "PCB Inspections", href: "/inspections", icon: ScanLine },
      ],
    },
    {
      title: "ANALYTICS & METRICS",
      items: [
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
            ],
          },
        ]
      : []),
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-surface-200 bg-surface-0 text-surface-700 select-none shadow-2xl lg:shadow-none lg:static lg:z-auto transition-transform duration-250 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand & Station Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-surface-200 bg-surface-0">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-surface-900 border border-surface-700 flex items-center justify-center p-1 shadow-xs group-hover:bg-surface-800 transition-colors">
            <img src="/logo.png" alt="PCB Vision Logo" className="w-full h-full object-contain" />
          </div>
          <div className="font-bold text-sm tracking-tight text-surface-900">
            PCB-VISION
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden p-1.5 rounded-md text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-surface-400 font-mono">
              {section.title}
            </div>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                      isActive
                        ? "bg-industrial-900 text-white shadow-xs font-semibold"
                        : "text-surface-600 hover:text-surface-900 hover:bg-surface-100/80"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        isActive ? "text-industrial-300" : "text-surface-400"
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

      {/* User Information & Session */}
      <div className="p-3 border-t border-surface-200 bg-surface-0">
        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-50 transition-colors">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-2.5 min-w-0 pr-1 group"
          >
            <div className="w-8 h-8 rounded-full bg-surface-100 border border-surface-200 text-surface-700 font-mono text-xs font-semibold flex items-center justify-center flex-shrink-0 group-hover:border-industrial-300 transition-colors">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-surface-900 truncate font-mono">
                {user?.email || "User"}
              </div>
              <div className="mt-0.5">
                <RoleBadge role={role || "viewer"} size="sm" />
              </div>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 rounded-md text-surface-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
