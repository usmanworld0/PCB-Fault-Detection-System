"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role-based route protection
    if (pathname.startsWith("/users") || pathname.startsWith("/audit-logs") || pathname.startsWith("/settings")) {
      if (role !== "admin") {
        router.push("/403");
        return;
      }
    }

    if (pathname.startsWith("/reviews")) {
      if (role !== "admin" && role !== "engineer") {
        router.push("/403");
        return;
      }
    }
  }, [isLoading, isAuthenticated, role, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface-50 text-surface-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-industrial-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs text-surface-500 font-mono tracking-wider uppercase">
            Initializing PCB-Vision Station...
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
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6 bg-surface-50">
          <div className="max-w-7xl mx-auto space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
