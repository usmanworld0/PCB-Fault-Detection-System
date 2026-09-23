"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  Percent,
  Clock,
  Bell,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { PassFailDonut } from "@/components/dashboard/PassFailDonut";
import { DefectBarChart } from "@/components/dashboard/DefectBarChart";
import { SeverityChart } from "@/components/dashboard/SeverityChart";
import { RecentInspectionsTable } from "@/components/dashboard/RecentInspectionsTable";
import { RecentAlertsFeed } from "@/components/dashboard/RecentAlertsFeed";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getStats } from "@/lib/api/stats";
import { getInspections } from "@/lib/api/inspections";
import { getNotifications } from "@/lib/api/notifications";
import { Stats, InspectionListItem, Notification } from "@/types/models";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInspections, setRecentInspections] = useState<InspectionListItem[]>([]);
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [statsData, inspectionsData, notificationsData] = await Promise.all([
        getStats(),
        getInspections({ limit: 6 }),
        getNotifications(false),
      ]);
      setStats(statsData);
      setRecentInspections(inspectionsData.items);
      setAlerts(notificationsData.items.filter((n) => n.severity === "Critical" || !n.is_read));
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header / Refresh Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-line">
          <div>
            <h2 className="text-[1.5rem]/7 lg:text-[1.75rem]/8 font-medium tracking-[-0.72px] text-foreground-primary">
              Industrial Inspection Dashboard
              <span className="block text-xs lg:text-sm text-foreground-tertiary mt-1 font-normal tracking-normal">
                Real-time quality metrics, AI anomaly detection, and station analytics
              </span>
            </h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium bg-background-secondary hover:bg-background-tertiary text-foreground-primary ring-1 ring-inset ring-border-secondary transition-colors duration-150 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadDashboardData} />
        ) : loading || !stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-[6px]" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-72 lg:col-span-2 rounded-[6px]" />
              <Skeleton className="h-72 rounded-[6px]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-72 rounded-[6px]" />
              <Skeleton className="h-72 rounded-[6px]" />
            </div>
          </div>
        ) : (
          <>
            {/* Top KPI Cards (7 Metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <StatCard
                label="Total Inspections"
                value={stats.total_inspections}
                subtext="Synced cloud runs"
                icon={Layers}
                variant="brand"
              />
              <StatCard
                label="Pass Rate"
                value={`${stats.yield_rate.toFixed(1)}%`}
                subtext={`${stats.pass_count} passed`}
                icon={Percent}
                variant="pass"
              />
              <StatCard
                label="Failed Boards"
                value={stats.fail_count}
                subtext="Detected defects"
                icon={XCircle}
                variant="fail"
              />
              <StatCard
                label="Total Defects"
                value={stats.total_defects}
                subtext="Localized regions"
                icon={AlertTriangle}
                variant="default"
              />
              <StatCard
                label="Critical Defects"
                value={stats.critical_defects}
                subtext="Open / short circuit"
                icon={AlertTriangle}
                variant="fail"
              />
              <StatCard
                label="Pending Reviews"
                value={stats.pending_reviews}
                subtext="Requires signoff"
                icon={Clock}
                variant="review"
              />
              <StatCard
                label="Active Alerts"
                value={stats.active_alerts}
                subtext="Unread events"
                icon={Bell}
                variant={stats.active_alerts > 0 ? "fail" : "default"}
              />
            </div>

            {/* Middle Charts: 30-Day Trend + Pass/Fail Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TrendChart data={stats.trend_last_30_days} />
              </div>
              <div>
                <PassFailDonut
                  passCount={stats.pass_count}
                  failCount={stats.fail_count}
                  yieldRate={stats.yield_rate}
                />
              </div>
            </div>

            {/* Defect Class Distribution + Severity Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DefectBarChart defectsByClass={stats.defects_by_class} />
              </div>
              <div>
                <SeverityChart defectsBySeverity={stats.defects_by_severity} />
              </div>
            </div>

            {/* Bottom Row: Recent Inspections Table + Critical Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentInspectionsTable inspections={recentInspections} />
              </div>
              <div>
                <RecentAlertsFeed alerts={alerts} />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
