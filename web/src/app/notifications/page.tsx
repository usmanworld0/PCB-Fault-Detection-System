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
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                Quality Alerts & Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white font-mono">
                  {unreadCount} UNREAD
                </span>
              )}
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Quality threshold anomalies, critical defect flags, and engineering review triggers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-xs transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-surface-500" />
                <span>Mark All as Read</span>
              </button>
            )}
            <button
              onClick={fetchNotifs}
              className="p-1.5 rounded bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              !filterUnread ? "bg-white text-surface-900 border border-surface-300 shadow-xs" : "text-surface-600 hover:text-surface-900"
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              filterUnread
                ? "bg-white text-surface-900 border border-surface-300 shadow-xs"
                : "text-surface-600 hover:text-surface-900"
            }`}
          >
            Unread Alarms ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-2.5">
          {error ? (
            <ErrorState message={error} onRetry={fetchNotifs} />
          ) : loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="You're all caught up"
              description="No active defect alarms or pending quality alerts at this time."
            />
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border transition-colors ${
                  notif.is_read
                    ? "bg-white border-surface-200"
                    : "bg-brand-50/20 border-brand-200 shadow-xs"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded mt-0.5 shrink-0 ${
                        notif.severity === "Critical"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-brand-50 text-brand-600 border border-brand-200"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-surface-900">{notif.title}</span>
                        <SeverityBadge severity={notif.severity} />
                        <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
                          {notif.category}
                        </span>
                      </div>
                      <p className="text-xs text-surface-600 mt-1 leading-relaxed">{notif.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[11px] text-surface-400 font-mono">
                          {formatDate(notif.created_at)} ({formatTimeAgo(notif.created_at)})
                        </span>
                        {notif.inspection_id && (
                          <Link
                            href={`/inspections/${notif.inspection_id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition-colors"
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
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors shrink-0"
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
