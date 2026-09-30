"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Settings,
  User as UserIcon,
  Menu,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getNotifications } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

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
    if (path.startsWith("/dashboard")) return { category: "Pages", title: "Dashboard" };
    if (path.startsWith("/inspections/")) return { category: "Pages", title: "Inspection Detail" };
    if (path.startsWith("/inspections")) return { category: "Pages", title: "Inspections" };
    if (path.startsWith("/models")) return { category: "Pages", title: "Model Registry" };
    if (path.startsWith("/reports")) return { category: "Pages", title: "Reports" };
    if (path.startsWith("/notifications")) return { category: "Pages", title: "Station Alerts" };
    if (path.startsWith("/users")) return { category: "Pages", title: "Users" };
    if (path.startsWith("/profile")) return { category: "Pages", title: "Profile" };
    return { category: "Pages", title: "Dashboard" };
  };

  const { category, title } = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 pt-3 pb-2 px-3 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[68px] px-4 sm:px-5 py-2.5 rounded-[16px] bg-white/80 backdrop-blur-[21px] border border-white/80 shadow-[0px_7px_23px_rgba(0,0,0,0.05)] transition-all">
        {/* Left Side: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Open Navigation Menu"
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-[11px] text-[#A0AEC0] font-normal">
              <span>{category}</span>
              <span>/</span>
              <span className="text-[#2D3748] font-medium">{title}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#2D3748] leading-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Right Side: Search, User, Settings, Bell */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          {/* Search Box (Exact Purity UI SearchBar style) */}
          <div className="relative flex items-center w-full sm:w-48 md:w-56">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type here..."
              className="w-full pl-8 pr-3 py-1.5 text-xs text-[#2D3748] bg-white border border-gray-200 rounded-[15px] focus:outline-none focus:border-[#4FD1C5] focus:ring-1 focus:ring-[#4FD1C5] transition-all placeholder:text-[#A0AEC0]"
            />
          </div>

          {/* User Sign In / Profile Button */}
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[12px] text-xs font-bold text-[#718096] hover:text-[#2D3748] hover:bg-gray-50 transition-colors"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className="w-5 h-5 rounded-full object-cover border border-[#4FD1C5]/50 shadow-2xs"
              />
            ) : (
              <UserIcon className="w-4 h-4 text-[#718096]" />
            )}
            <span className="hidden md:inline">
              {user?.email ? user.email.split("@")[0] : "Sign In"}
            </span>
          </Link>

          {/* Settings Icon */}
          <Link
            href="/profile"
            className="p-2 rounded-lg text-gray-400 hover:text-[#2D3748] hover:bg-gray-50 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          {/* Notification Bell */}
          <Link
            href="/notifications"
            className="relative p-2 rounded-lg text-gray-400 hover:text-[#2D3748] hover:bg-gray-50 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#E53E3E] text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
