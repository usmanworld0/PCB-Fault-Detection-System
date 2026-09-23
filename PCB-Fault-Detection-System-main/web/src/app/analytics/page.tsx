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
import { DEFECT_LABELS, DEFECT_COLORS } from "@/lib/constants/defects";

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
    color: DEFECT_COLORS[cls] || "#6366F1",
  }));

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Quality & Defect Analytics</h2>
            <p className="text-xs text-slate-400 mt-1">
              Statistical production metrics, defect yield trends, and comparative inference performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
              <button
                onClick={() => setDaysFilter(7)}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  daysFilter === 7 ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDaysFilter(30)}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  daysFilter === 30 ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                30 Days
              </button>
            </div>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg border border-slate-800 bg-surface-100 hover:bg-surface-50 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : loading || !stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Charts: Volume Trend + Defect Rate Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Volume Trend */}
              <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Inspection Volume Trend</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Daily throughput of inspected PCB units</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="inspections"
                        name="Boards Inspected"
                        stroke="#6366F1"
                        strokeWidth={2}
                        fill="url(#volGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Defect Rate Line Chart */}
              <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">Defect Density Rate (%)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Ratio of defects per inspected board over time</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Target: &lt; 5%
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="displayDate" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#334155",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="defectRate"
                        name="Defect Rate %"
                        stroke="#F43F5E"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#F43F5E" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Middle: Defect Pareto Bar Chart */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Defect Class Pareto Breakdown</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Absolute count per PCB fault classification</p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defectBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {defectBarData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model Inference Latency & Accuracy Overview */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Model Benchmark Accuracy Summary</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluating trained detection architectures on held-out DeepPCB test set
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3">Architecture</th>
                      <th className="py-2.5 px-3">Dataset</th>
                      <th className="py-2.5 px-3">mAP@50</th>
                      <th className="py-2.5 px-3">Precision</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">F1-Score</th>
                      <th className="py-2.5 px-3">Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {models.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono font-semibold text-white">{m.name}</td>
                        <td className="py-2.5 px-3 text-slate-300">{m.arch}</td>
                        <td className="py-2.5 px-3 text-slate-400">{m.dataset || "DeepPCB"}</td>
                        <td className="py-2.5 px-3 font-semibold text-indigo-400">
                          {m.map50 ? `${(m.map50 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {m.precision ? `${(m.precision * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {m.recall ? `${(m.recall * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {m.f1 ? `${(m.f1 * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
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
