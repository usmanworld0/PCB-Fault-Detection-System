"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Percent,
  Layers,
  Cpu,
  RefreshCw,
  PieChart as PieIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getStats } from "@/lib/api/stats";
import { getModels } from "@/lib/api/models";
import { Stats, ModelMetric } from "@/types/models";
import { DEFECT_LABELS } from "@/lib/constants/defects";

// Crisp industrial palette
const INDUSTRIAL_COLORS: Record<string, string> = {
  open: "#dc2626",
  short: "#ea580c",
  mousebite: "#d97706",
  spur: "#7c3aed",
  copper: "#059669",
  pinhole: "#0284c7",
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [models, setModels] = useState<ModelMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(30);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, modelsData] = await Promise.all([getStats(), getModels()]);
      setStats(statsData);
      setModels(modelsData);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const trendData = (stats?.trend_last_30_days || []).slice(-daysFilter).map((item) => {
    const defectRate =
      item.inspections > 0 ? Math.round((item.defects / item.inspections) * 100) : 0;
    return {
      ...item,
      displayDate: item.date ? item.date.slice(5) : "",
      defectRate,
    };
  });

  const defectClasses = ["open", "short", "mousebite", "spur", "copper", "pinhole"];
  const defectBarData = defectClasses.map((cls) => ({
    name: DEFECT_LABELS[cls] || cls,
    count: stats?.defects_by_class[cls] || 0,
    color: INDUSTRIAL_COLORS[cls] || "#64748b",
  }));

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                Quality & Production Analytics
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                TELEMETRY & STATS
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Statistical process control, defect density trends, and comparative inference performance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded bg-surface-200/70 border border-surface-200 p-0.5">
              <button
                onClick={() => setDaysFilter(7)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  daysFilter === 7 ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDaysFilter(30)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  daysFilter === 30 ? "bg-white text-surface-900 shadow-xs" : "text-surface-600 hover:text-surface-900"
                }`}
              >
                Last 30 Days
              </button>
            </div>
            <button
              onClick={loadData}
              className="p-1.5 rounded bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : loading || !stats ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Skeleton className="h-72 w-full rounded-lg" />
              <Skeleton className="h-72 w-full rounded-lg" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Skeleton className="h-72 w-full rounded-lg" />
              <Skeleton className="h-72 w-full rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Charts: Volume Trend + Defect Rate Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Daily Volume Trend */}
              <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900">Inspection Throughput Volume</h3>
                    <p className="text-xs text-surface-500 mt-0.5">Daily number of inspected PCB units</p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
                    VOLUME
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="inspections"
                        name="Boards Inspected"
                        stroke="#0284c7"
                        strokeWidth={1.5}
                        fill="url(#volGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Defect Rate Line Chart */}
              <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-surface-900">Defect Density Rate (%)</h3>
                    <p className="text-xs text-surface-500 mt-0.5">Ratio of defects per inspected board over time</p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    TARGET: &lt; 5.0%
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderColor: "#e2e8f0",
                          borderRadius: "6px",
                          fontSize: "12px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="defectRate"
                        name="Defect Rate %"
                        stroke="#dc2626"
                        strokeWidth={1.5}
                        dot={{ r: 3, fill: "#dc2626" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Middle: Defect Pareto Bar Chart */}
            <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900">Defect Classification Pareto Breakdown</h3>
                  <p className="text-xs text-surface-500 mt-0.5">Total counts localized across the 6 defect categories</p>
                </div>
                <span className="text-xs font-mono font-medium text-surface-600">
                  Total: <span className="font-semibold text-surface-900">{stats.total_defects}</span>
                </span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e2e8f0",
                        borderRadius: "6px",
                        fontSize: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={48}>
                      {defectBarData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model Benchmark Accuracy Overview */}
            <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Model Benchmark Accuracy Summary</h3>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Evaluating trained detection architectures on held-out DeepPCB test set
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                  BENCHMARK
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                      <th className="py-2.5 px-3 font-semibold">Model</th>
                      <th className="py-2.5 px-3 font-semibold">Architecture</th>
                      <th className="py-2.5 px-3 font-semibold">Dataset</th>
                      <th className="py-2.5 px-3 font-semibold">mAP@50</th>
                      <th className="py-2.5 px-3 font-semibold">Precision</th>
                      <th className="py-2.5 px-3 font-semibold">Recall</th>
                      <th className="py-2.5 px-3 font-semibold">F1-Score</th>
                      <th className="py-2.5 px-3 font-semibold">Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {models.map((m) => (
                      <tr key={m.id} className="hover:bg-surface-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-surface-900">{m.name}</td>
                        <td className="py-2.5 px-3 text-surface-700">{m.arch}</td>
                        <td className="py-2.5 px-3 font-mono text-surface-500">{m.dataset || "DeepPCB"}</td>
                        <td className="py-2.5 px-3 font-semibold text-brand-700 font-mono">
                          {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-surface-700 font-mono">
                          {m.precision ? `${(m.precision * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-surface-700 font-mono">
                          {m.recall ? `${(m.recall * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-surface-700 font-mono">
                          {m.f1 ? `${(m.f1 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-medium">
                          {m.cpu_ms ? `${m.cpu_ms.toFixed(1)} ms` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
