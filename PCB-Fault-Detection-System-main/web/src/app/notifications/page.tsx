"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/api/notifications";
import { Notification } from "@/types/models";
import { formatDate, formatTimeAgo } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterUnread, setFilterUnread] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications(filterUnread);
      setNotifications(data.items);
      setUnreadCount(data.unread_count);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [filterUnread]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // fail silently
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // fail silently
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Notification Center</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Quality threshold anomalies, critical defect flags, and engineering review triggers
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-50 text-slate-200 border border-slate-700 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All as Read</span>
              </button>
            )}
            <button
              onClick={fetchNotifs}
              className="p-1.5 rounded-lg border border-slate-800 bg-surface-100 hover:bg-surface-50 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              !filterUnread ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterUnread
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Unread Only
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {error ? (
            <ErrorState message={error} onRetry={fetchNotifs} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="You're all caught up."
              description="No unread defect alarms or pending system notifications at this time."
            />
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition ${
                  notif.is_read
                    ? "bg-[#0E1422]/60 border-slate-800/60 opacity-80"
                    : "bg-[#0E1422] border-slate-700 shadow-md shadow-black/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        notif.severity === "Critical"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white">{notif.title}</span>
                        <SeverityBadge severity={notif.severity} />
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {notif.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[11px] text-slate-400">
                          {formatDate(notif.created_at)} ({formatTimeAgo(notif.created_at)})
                        </span>
                        {notif.inspection_id && (
                          <Link
                            href={`/inspections/${notif.inspection_id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition"
                          >
                            <span>Inspect Board</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-xs font-medium text-slate-400 hover:text-indigo-400 transition flex-shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
