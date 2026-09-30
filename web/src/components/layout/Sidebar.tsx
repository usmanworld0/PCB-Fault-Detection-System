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
  HelpCircle,
  X,
  FileText,
  User,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { RoleBadge } from "@/components/common/RoleBadge";
import { IconBox } from "@/components/purity/IconBox";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const isAdmin = role === "admin";

  const navigationSections = [
    {
      title: "PAGES",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Inspections", href: "/inspections", icon: ScanLine },
        { label: "Model Registry", href: "/models", icon: Cpu },
        { label: "Quality Reports", href: "/reports", icon: FileSpreadsheet },
        { label: "Station Alerts", href: "/notifications", icon: Bell },
      ],
    },
    {
      title: "ACCOUNT PAGES",
      items: [
        { label: "Profile", href: "/profile", icon: User },
        ...(isAdmin
          ? [{ label: "Users & Operators", href: "/users", icon: Users }]
          : []),
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-[265px] flex flex-col my-0 lg:my-3 lg:ml-3 lg:rounded-[20px] bg-[#F8F9FA] lg:bg-[#F8F9FA] select-none transition-transform duration-300 ease-in-out border-r lg:border lg:border-gray-200/70 shadow-2xl lg:shadow-none lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand Header */}
      <div className="pt-6 pb-2 px-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 group w-full"
        >
          <img
            src="/pcb-fault-logo.png"
            alt="PCB Vision"
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wider text-[#2D3748] uppercase">
              PCB VISION
            </span>
            <span className="text-[10px] font-semibold text-[#A0AEC0] tracking-tight">
              FAULT DETECTION SYSTEM
            </span>
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Elegant Separator */}
      <div className="mx-6 my-3 h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {navigationSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2D3748]">
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-[15px] text-xs transition-all duration-200",
                      isActive
                        ? "bg-white text-[#2D3748] font-bold shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]"
                        : "text-[#A0AEC0] hover:text-[#2D3748] hover:bg-white/60 font-medium"
                    )}
                  >
                    <IconBox
                      size="sm"
                      className={cn(
                        "transition-colors",
                        isActive
                          ? "bg-[#4FD1C5] text-white shadow-[0_2px_6px_rgba(79,209,197,0.3)]"
                          : "bg-white text-[#4FD1C5] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </IconBox>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        {/* Sidebar Help Card (Exact Purity UI SidebarHelp) */}
        <div className="pt-2">
          <div className="relative rounded-[15px] p-4 text-white overflow-hidden bg-gradient-to-br from-[#319795] to-[#4FD1C5] shadow-sm">
            <div className="w-8 h-8 rounded-[10px] bg-white flex items-center justify-center text-[#4FD1C5] mb-3 shadow-xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h5 className="font-bold text-xs mb-1">Need help?</h5>
            <p className="text-[11px] text-white/90 leading-tight mb-3">
              Please check our documentation and model specs.
            </p>
            <Link
              href="/models"
              className="block w-full py-1.5 text-center text-[10px] font-bold uppercase tracking-wider bg-white text-[#2D3748] hover:bg-gray-50 rounded-[10px] shadow-xs transition-colors"
            >
              DOCUMENTATION
            </Link>
          </div>
        </div>
      </div>

      {/* User Information & Session */}
      <div className="p-3 mx-3 mb-3 mt-auto rounded-[15px] bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] border border-gray-100/70">
        <div className="flex items-center justify-between p-1">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-2.5 min-w-0 pr-1 group"
          >
            <div className="w-7 h-7 rounded-full bg-[#E6FFFA] text-[#319795] text-xs font-bold flex items-center justify-center shrink-0 border border-teal-200">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#2D3748] truncate">
                {user?.email?.split("@")[0] || "User"}
              </div>
              <div className="text-[10px] text-[#A0AEC0] capitalize">
                {role || "viewer"}
              </div>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
