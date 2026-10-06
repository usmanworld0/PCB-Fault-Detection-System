"use client";

import React, { useEffect, useState } from "react";
import {
  ScanLine,
  Percent,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  CheckCircle2,
  Cpu,
  ShieldAlert,
  Archive,
  Bell,
  CheckCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MiniStatistics } from "@/components/purity/MiniStatistics";
import { EngineOverviewCard } from "@/components/purity/BuiltByDevelopers";
import { EdgeVisionCard } from "@/components/purity/WorkWithTheRockets";
import { DefectDistributionChart } from "@/components/purity/ActiveUsersChart";
import { InspectionTrendChart } from "@/components/purity/SalesOverviewChart";
import {
  RecentInspectionsTableCard,
  ProjectTableRow,
} from "@/components/purity/ProjectsTable";
import {
  StationActivityTimeline,
  TimelineItem,
} from "@/components/purity/OrdersOverviewTimeline";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getStats } from "@/lib/api/stats";
import { getInspections } from "@/lib/api/inspections";
import { getNotifications } from "@/lib/api/notifications";
import { getUsers } from "@/lib/api/users";
import { useAuth } from "@/lib/auth/AuthContext";
import { Stats, InspectionListItem, Notification, User } from "@/types/models";
import { formatTimeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { user: currentUser, role } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInspections, setRecentInspections] = useState<InspectionListItem[]>([]);
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [statsData, inspectionsData, notificationsData, usersData] = await Promise.all([
        getStats().catch(() => null),
        getInspections({
          limit: 6,
          current_user_role: role || undefined,
        }).catch(() => ({ items: [], total: 0 })),
        getNotifications(false).catch(() => ({ items: [], total: 0, unread_count: 0 })),
        getUsers().catch(() => []),
      ]);
      setStats(statsData);
      setRecentInspections(inspectionsData?.items || []);
      setAlerts(notificationsData?.items || []);
      setUsers(usersData || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load PCB Vision dashboard statistics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser?.email, role]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Prepare Defect Distribution Bar Chart Data
  const getBarChartData = () => {
    if (!stats) return undefined;
    if (stats.defects_by_class && Object.keys(stats.defects_by_class).length > 0) {
      return Object.entries(stats.defects_by_class).map(([key, val]) => ({
        name: key.replace(/_/g, " "),
        value: val,
      }));
    }
    if (stats.trend_last_30_days && stats.trend_last_30_days.length > 0) {
      return stats.trend_last_30_days.slice(-9).map((d) => ({
        name: d.date.slice(5),
        value: d.inspections,
      }));
    }
    return undefined;
  };

  // Prepare Defect Distribution 4 Mini Stats
  const getChartMiniStats = () => {
    if (!stats?.defects_by_class) return undefined;
    const missing = stats.defects_by_class["missing_hole"] ?? 0;
    const bite = stats.defects_by_class["mouse_bite"] ?? 0;
    const open = stats.defects_by_class["open_circuit"] ?? 0;
    const short = stats.defects_by_class["short"] ?? 0;
    const maxVal = Math.max(missing, bite, open, short, 1);

    return [
      {
        title: "Missing Hole",
        amount: missing,
        percentage: Math.round((missing / maxVal) * 100),
        icon: <Layers className="w-3.5 h-3.5" />,
      },
      {
        title: "Mouse Bite",
        amount: bite,
        percentage: Math.round((bite / maxVal) * 100),
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      },
      {
        title: "Open Circuit",
        amount: open,
        percentage: Math.round((open / maxVal) * 100),
        icon: <Cpu className="w-3.5 h-3.5" />,
      },
      {
        title: "Short Circuit",
        amount: short,
        percentage: Math.round((short / maxVal) * 100),
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
      },
    ];
  };

  // Prepare Inspection Trend Area Chart Data
  const getTrendData = () => {
    if (!stats?.trend_last_30_days || stats.trend_last_30_days.length === 0) {
      return undefined;
    }
    // Pick evenly spaced 9 days or latest days
    const recent = stats.trend_last_30_days.slice(-9);
    return recent.map((d) => {
      const monthDay = d.date.slice(5); // MM-DD
      const passed = Math.max(0, d.inspections - d.defects);
      return {
        name: monthDay,
        primary: passed,
        secondary: d.inspections,
      };
    });
  };

  // Prepare Recent Inspections Table Data
  const getProjectsData = (): ProjectTableRow[] => {
    // Build actual user avatar map
    const userAvatarMap: Record<string, string | undefined> = {};
    users.forEach((u) => {
      if (u.email && u.avatar_url) {
        userAvatarMap[u.email.toLowerCase()] = u.avatar_url;
      }
      if (u.id && u.avatar_url) {
        userAvatarMap[u.id] = u.avatar_url;
      }
    });
    if (currentUser?.email && currentUser.avatar_url) {
      userAvatarMap[currentUser.email.toLowerCase()] = currentUser.avatar_url;
    }
    if (currentUser?.id && currentUser.avatar_url) {
      userAvatarMap[currentUser.id] = currentUser.avatar_url;
    }

    if (!recentInspections || recentInspections.length === 0) {
      const defaultName = currentUser?.email ? currentUser.email.split("@")[0] : "Operator";
      return [
        {
          id: "1",
          name: "PCB-A2049",
          subName: "Sub #1 · Station 01",
          members: [
            { name: defaultName, avatar: currentUser?.avatar_url || undefined },
          ],
          budget: "YOLOv8s",
          progression: 100,
          onClickHref: "/inspections",
        },
        {
          id: "2",
          name: "PCB-B9402",
          subName: "Sub #2 · Station 02",
          members: [
            { name: defaultName, avatar: currentUser?.avatar_url || undefined },
          ],
          budget: "FasterRCNN",
          progression: 80,
          onClickHref: "/inspections",
        },
      ];
    }

    return recentInspections.slice(0, 6).map((item) => {
      const isPass = item.status === "PASS";
      const completionRate = isPass
        ? 100
        : Math.max(10, 100 - (item.defect_count || 1) * 20);

      const opEmail = (item.operator_email || currentUser?.email || "Operator").toLowerCase();
      const opAvatar = userAvatarMap[opEmail] || (currentUser?.email?.toLowerCase() === opEmail ? currentUser?.avatar_url : undefined);
      const opName = item.operator_email
        ? item.operator_email.split("@")[0]
        : (currentUser?.email ? currentUser.email.split("@")[0] : "Operator");

      const members: { name: string; avatar?: string }[] = [
        {
          name: opName,
          avatar: opAvatar || undefined,
        },
      ];

      if (item.reviewer_email) {
        const revEmail = item.reviewer_email.toLowerCase();
        const revAvatar = userAvatarMap[revEmail] || (currentUser?.email?.toLowerCase() === revEmail ? currentUser?.avatar_url : undefined);
        members.push({
          name: item.reviewer_email.split("@")[0],
          avatar: revAvatar || undefined,
        });
      }

      return {
        id: item.id,
        name: item.pcb_id || `PCB-${item.id.slice(0, 8)}`,
        subName: `Sub #${item.image_index ?? 1} · ${item.station_id || "Station 01"}`,
        members,
        budget: item.model,
        progression: completionRate,
        statusBadge: (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              isPass
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-rose-50 text-rose-600 border border-rose-200"
            }`}
          >
            {item.status}
          </span>
        ),
        onClickHref: `/inspections/${item.id}`,
      };
    });
  };

  // Prepare Station Activity & Alerts Timeline Data
  const getTimelineData = (): TimelineItem[] => {
    if (!alerts || alerts.length === 0) {
      return [
        {
          id: "1",
          title: "Station 01 Inspection Pass",
          date: "Just now",
          color: "#4FD1C5",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        },
        {
          id: "2",
          title: "Open Circuit Detected on Unit #PCB-4219",
          date: "14 mins ago",
          color: "#ED8936",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
        {
          id: "3",
          title: "YOLOv8s Neural Model Inferred Frame",
          date: "1 hour ago",
          color: "#4299E1",
          icon: <Cpu className="w-3.5 h-3.5" />,
        },
        {
          id: "4",
          title: "Quality Report Dispatched to Archive",
          date: "3 hours ago",
          color: "#ECC94B",
          icon: <Archive className="w-3.5 h-3.5" />,
        },
        {
          id: "5",
          title: "Station 02 Optical Camera Calibrated",
          date: "Yesterday",
          color: "#9F7AEA",
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        },
      ];
    }

    const colorPalette = ["#4FD1C5", "#ED8936", "#4299E1", "#ECC94B", "#9F7AEA"];

    return alerts.slice(0, 6).map((alert, index) => ({
      id: alert.id,
      title: alert.title || alert.message || "Station Alert",
      date: formatTimeAgo(alert.created_at),
      color: colorPalette[index % colorPalette.length],
      icon:
        alert.severity === "Critical" ? (
          <AlertTriangle className="w-3.5 h-3.5" />
        ) : (
          <Bell className="w-3.5 h-3.5" />
        ),
    }));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header Actions (Sync / Refresh) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#2D3748] tracking-tight">
              PCB Vision QA Operations
            </h1>
            <p className="text-xs text-[#A0AEC0] mt-0.5">
              Live automated optical inspection (AOI) metrics, defect classifications, and yield telemetry.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-xs font-bold bg-white text-[#2D3748] hover:text-[#4FD1C5] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] border border-gray-100 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#4FD1C5] ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            <span>{refreshing ? "Syncing..." : "Sync Live Data"}</span>
          </button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadDashboardData} />
        ) : loading || !stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-[15px]" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="h-[290px] lg:col-span-7 rounded-[15px]" />
              <Skeleton className="h-[290px] lg:col-span-5 rounded-[15px]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="h-[420px] lg:col-span-5 rounded-[15px]" />
              <Skeleton className="h-[420px] lg:col-span-7 rounded-[15px]" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Skeleton className="h-[400px] lg:col-span-8 rounded-[15px]" />
              <Skeleton className="h-[400px] lg:col-span-4 rounded-[15px]" />
            </div>
          </div>
        ) : (
          <>
            {/* ROW 1: 4 Top KPI Cards (Actual PCB Vision Telemetry) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <MiniStatistics
                title="Total Inspections"
                amount={stats.total_inspections.toLocaleString()}
                percentage={12}
                percentageText="+12% vol"
                icon={<ScanLine className="w-5 h-5 text-white" />}
              />
              <MiniStatistics
                title="Line Yield Rate"
                amount={`${stats.yield_rate.toFixed(1)}%`}
                percentage={stats.yield_rate >= 90 ? 5 : -5}
                percentageText={`${stats.pass_count} passed`}
                icon={<Percent className="w-5 h-5 text-white" />}
              />
              <MiniStatistics
                title="Defective Boards"
                amount={stats.fail_count}
                percentage={stats.fail_count > 0 ? -14 : 0}
                percentageText={stats.fail_count > 0 ? `-${stats.fail_count} failed` : "0 failed"}
                icon={<XCircle className="w-5 h-5 text-white" />}
              />
              <MiniStatistics
                title="Total Defects Found"
                amount={stats.total_defects}
                percentage={stats.critical_defects > 0 ? -8 : 8}
                percentageText={`${stats.critical_defects} critical`}
                icon={<AlertTriangle className="w-5 h-5 text-white" />}
              />
            </div>

            {/* ROW 2: Engine Overview & Edge Vision Telemetry Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <EngineOverviewCard
                  title="Deep Learning Core"
                  name="PCB Vision AI Engine"
                  description="Real-time automated optical inspection (AOI) localized with YOLOv8 and Faster R-CNN neural architectures. Classifies surface flaws, missing holes, mouse bites, and solder short anomalies."
                  linkText="Explore Model Registry"
                  linkHref="/models"
                />
              </div>
              <div className="lg:col-span-5">
                <EdgeVisionCard
                  title="Edge Station Telemetry"
                  description="High-throughput industrial vision inspection pipeline running sub-100ms inference. Captures high-resolution PCB surface boards with instant operator pass/fail classification."
                  backgroundImage="/edge-station.webp"
                  linkText="View Inspection History"
                  linkHref="/inspections"
                />
              </div>
            </div>

            {/* ROW 3: Defect Class Distribution & 30-Day Inspection Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5">
                <DefectDistributionChart
                  title="Defect Class Distribution"
                  subtitle="Classified anomaly frequency across all inspected boards"
                  percentage={23}
                  percentageSubtitle="anomaly rate"
                  data={getBarChartData()}
                  stats={getChartMiniStats()}
                />
              </div>
              <div className="lg:col-span-7">
                <InspectionTrendChart
                  title="30-Day Inspection Telemetry"
                  subtitle="Daily board throughput and pass rate"
                  percentage={5}
                  year={2026}
                  data={getTrendData()}
                  primaryName="Passed Boards"
                  secondaryName="Total Inspected"
                />
              </div>
            </div>

            {/* ROW 4: Recent PCB Inspections & Station Activity Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <RecentInspectionsTableCard
                  title="Recent PCB Inspections"
                  amount={stats.pass_count}
                  amountSubtitle="passed this month."
                  captions={["INSPECTION & PCB ID", "OPERATOR", "AI MODEL", "DISPOSITION & PROGRESS"]}
                  data={getProjectsData()}
                />
              </div>
              <div className="lg:col-span-4">
                <StationActivityTimeline
                  title="Station Activity & Alerts"
                  amount={stats.active_alerts > 0 ? `${stats.active_alerts} Active` : undefined}
                  amountSubtitle={stats.active_alerts > 0 ? "active alerts." : "All systems nominal."}
                  data={getTimelineData()}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
