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
  Activity,
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
      <div className="space-y-6">
        {/* Operations Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                Quality Assurance Control Center
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AOI LINE-01 ACTIVE
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Real-time automated optical inspection (AOI) metrics, line yield analysis, and defect localization telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Synchronizing..." : "Refresh Telemetry"}</span>
            </button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadDashboardData} />
        ) : loading || !stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-80 lg:col-span-2 rounded-lg" />
              <Skeleton className="h-80 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-80 lg:col-span-2 rounded-lg" />
              <Skeleton className="h-80 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-80 lg:col-span-2 rounded-lg" />
              <Skeleton className="h-80 rounded-lg" />
            </div>
          </div>
        ) : (
          <>
            {/* Top KPI Cards (7 Metrics) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatCard
                label="Total Inspections"
                value={stats.total_inspections}
                subtext="Synced cloud runs"
                icon={Layers}
                variant="brand"
              />
              <StatCard
                label="Line Yield Rate"
                value={`${stats.yield_rate.toFixed(1)}%`}
                subtext={`${stats.pass_count} passed boards`}
                icon={Percent}
                variant="pass"
              />
              <StatCard
                label="Defective Boards"
                value={stats.fail_count}
                subtext="Failed QA threshold"
                icon={XCircle}
                variant="fail"
              />
              <StatCard
                label="Total Defects"
                value={stats.total_defects}
                subtext="Localized anomalies"
                icon={AlertTriangle}
                variant="default"
              />
              <StatCard
                label="Critical Flaws"
                value={stats.critical_defects}
                subtext="Open / short circuit"
                icon={AlertTriangle}
                variant="fail"
              />
              <StatCard
                label="Pending Review"
                value={stats.pending_reviews}
                subtext="Awaiting signoff"
                icon={Clock}
                variant="review"
              />
              <StatCard
                label="Active Alerts"
                value={stats.active_alerts}
                subtext="System notifications"
                icon={Bell}
                variant={stats.active_alerts > 0 ? "fail" : "default"}
              />
            </div>

            {/* Middle Charts: 30-Day Production Trend + Yield Donut */}
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
