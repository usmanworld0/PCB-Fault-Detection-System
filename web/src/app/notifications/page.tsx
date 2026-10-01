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
import { EmailAlertSettingsCard } from "@/components/purity/EmailAlertSettingsCard";

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-[8px] text-[10px] font-bold uppercase tracking-wider bg-[#FFF5F5] text-[#E53E3E]">
                  {unreadCount} UNREAD
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#A0AEC0] mt-0.5">
              Alerts, defect flags, and real-time station events.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold text-[#2D3748] bg-white hover:bg-gray-50 border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#4FD1C5]" />
                <span>Mark All as Read</span>
              </button>
            )}
            <button
              onClick={fetchNotifs}
              className="p-2 rounded-[10px] bg-white hover:bg-gray-50 text-[#2D3748] border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#4FD1C5] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Resend Email Notification Settings Card */}
        <EmailAlertSettingsCard />

        {/* Filter Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterUnread(false)}
            className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition-all ${
              !filterUnread
                ? "bg-white text-[#2D3748] border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]"
                : "text-[#A0AEC0] hover:text-[#2D3748]"
            }`}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`px-3.5 py-2 rounded-[10px] text-xs font-bold transition-all ${
              filterUnread
                ? "bg-white text-[#2D3748] border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]"
                : "text-[#A0AEC0] hover:text-[#2D3748]"
            }`}
          >
            Unread Alarms ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {error ? (
            <ErrorState message={error} onRetry={fetchNotifs} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-[15px]" />
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
                className={`p-5 rounded-[15px] border transition-all ${
                  notif.is_read
                    ? "bg-white border-gray-200/70 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]"
                    : "bg-white border-[#4FD1C5] ring-1 ring-[#4FD1C5]/30 shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-[10px] mt-0.5 shrink-0 ${
                        notif.severity === "Critical"
                          ? "bg-rose-50 text-[#E53E3E]"
                          : "bg-[#E6FFFA] text-[#319795]"
                      }`}
                    >
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[#2D3748]">{notif.title}</span>
                        <SeverityBadge severity={notif.severity} />
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-[8px] bg-gray-100 text-[#2D3748]">
                          {notif.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#718096] mt-1 leading-relaxed break-words">{notif.message}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-[10px] text-[#A0AEC0] font-semibold">
                          {formatDate(notif.created_at)} ({formatTimeAgo(notif.created_at)})
                        </span>
                        {notif.inspection_id && (
                          <Link
                            href={`/inspections/${notif.inspection_id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#4FD1C5] hover:text-[#319795] transition-colors"
                          >
                            <span>Inspect Board</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="self-end sm:self-auto text-[10px] font-bold uppercase tracking-wider text-[#319795] hover:text-[#4FD1C5] px-2.5 py-1 rounded-[8px] hover:bg-[#E6FFFA] transition-colors shrink-0"
                    >
                      Mark Read
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
