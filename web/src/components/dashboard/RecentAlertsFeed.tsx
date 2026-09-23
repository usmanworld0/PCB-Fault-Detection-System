"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Bell, CheckCircle2 } from "lucide-react";
import { Notification } from "@/types/models";
import { formatTimeAgo } from "@/lib/utils";

interface RecentAlertsFeedProps {
  alerts: Notification[];
}

export function RecentAlertsFeed({ alerts }: RecentAlertsFeedProps) {
  return (
    <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Active Quality Alerts</h3>
        </div>
        <Link
          href="/notifications"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          All Notifications
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center bg-surface-50/50 rounded border border-dashed border-surface-200">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-surface-700">No active alerts</p>
          <p className="text-[11px] text-surface-400 mt-0.5">All production lines operating within nominal limits</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded border border-surface-200 bg-surface-50/50 hover:bg-surface-50 transition-colors flex items-start gap-3"
            >
              <div
                className={`p-1.5 rounded shrink-0 mt-0.5 ${
                  alert.severity === "Critical"
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-amber-50 text-amber-600 border border-amber-200"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-surface-900 truncate">{alert.title}</span>
                  <span className="text-[10px] text-surface-400 font-mono shrink-0">
                    {formatTimeAgo(alert.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-surface-600 mt-1 line-clamp-2 leading-relaxed">{alert.message}</p>
                {alert.inspection_id && (
                  <Link
                    href={`/inspections/${alert.inspection_id}`}
                    className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-700 font-medium mt-1.5 transition-colors"
                  >
                    <span>View Inspection Record</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
