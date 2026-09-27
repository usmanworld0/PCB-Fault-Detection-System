"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layers } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, role, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role-based route protection
    if (pathname.startsWith("/users")) {
      if (role !== "admin") {
        router.push("/403");
        return;
      }
    }
  }, [isLoading, isAuthenticated, role, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-50 text-surface-700 bg-grid-pattern">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white border border-surface-200 shadow-md max-w-xs w-full text-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-surface-900 border border-surface-700 flex items-center justify-center p-2 shadow-md">
              <img src="/logo.png" alt="PCB Vision Logo" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-industrial-500 border-t-transparent animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold text-surface-900 tracking-wider font-mono">PCB-VISION</div>
            <div className="text-[11px] text-surface-500 font-mono tracking-wider uppercase mt-1">
              Initializing Station...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 text-surface-900 font-sans">
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-surface-950/60 backdrop-blur-xs lg:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 bg-surface-50">
          <div className="max-w-7xl mx-auto space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
