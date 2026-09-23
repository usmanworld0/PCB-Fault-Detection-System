"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Bell, CheckCircle } from "lucide-react";
import { Notification } from "@/types/models";
import { formatTimeAgo } from "@/lib/utils";

interface RecentAlertsFeedProps {
  alerts: Notification[];
}

export function RecentAlertsFeed({ alerts }: RecentAlertsFeedProps) {
  return (
    <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-error" />
          <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">Critical Quality Alerts</h3>
        </div>
        <Link
          href="/notifications"
          className="text-xs font-medium text-brand-base hover:text-brand-vivid transition-colors duration-150"
        >
          All Alerts
        </Link>
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle className="w-6 h-6 text-brand-base mx-auto mb-2" />
          <p className="text-xs text-foreground-tertiary">No active critical alerts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-[4px] bg-background-primary ring-1 ring-inset ring-border-secondary flex items-start gap-3"
            >
              <div
                className={`p-1.5 rounded-[2px] mt-0.5 ring-1 ring-inset ${
                  alert.severity === "Critical"
                    ? "bg-error/10 text-error ring-error/20"
                    : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-primary truncate">{alert.title}</span>
                  <span className="text-[10px] text-foreground-tertiary font-mono flex-shrink-0 ml-2">
                    {formatTimeAgo(alert.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-foreground-tertiary mt-0.5 line-clamp-2">{alert.message}</p>
                {alert.inspection_id && (
                  <Link
                    href={`/inspections/${alert.inspection_id}`}
                    className="inline-flex items-center gap-1 text-[10px] text-brand-base hover:text-brand-vivid mt-1 font-medium transition-colors duration-150"
                  >
                    <span>View Inspection</span>
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
