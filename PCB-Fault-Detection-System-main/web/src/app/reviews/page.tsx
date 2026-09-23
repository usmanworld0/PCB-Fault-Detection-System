"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Clock, Filter, Eye, RefreshCw, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { getReviewQueue } from "@/lib/api/reviews";
import { InspectionListItem } from "@/types/models";
import { formatDate, formatTimeAgo } from "@/lib/utils";

export default function ReviewQueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<InspectionListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"PENDING" | "COMPLETED" | "ALL">("PENDING");

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReviewQueue({ filter_status: filterStatus, limit: 50 });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filterStatus]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Quality Review Queue</h2>
            <p className="text-xs text-slate-400 mt-1">
              Human-in-the-loop manual verification and disposition signoff for flagged board inspections
            </p>
          </div>
          <button
            onClick={fetchQueue}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-100 hover:bg-surface-50 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === "PENDING"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Review ({filterStatus === "PENDING" ? total : "Queue"})
          </button>
          <button
            onClick={() => setFilterStatus("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === "COMPLETED"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Completed Reviews
          </button>
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterStatus === "ALL"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All Inspections
          </button>
        </div>

        {/* Review Table / Cards */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
          {error ? (
            <ErrorState message={error} onRetry={fetchQueue} />
          ) : loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No inspections require review."
              description="All synchronized inspection records have been processed and confirmed by automated and engineering workflows."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Inspection ID</th>
                    <th className="py-3 px-3">Date / Time</th>
                    <th className="py-3 px-3">Station</th>
                    <th className="py-3 px-3">Model</th>
                    <th className="py-3 px-3">AI Disposition</th>
                    <th className="py-3 px-3">Defects</th>
                    <th className="py-3 px-3">Review Status</th>
                    <th className="py-3 px-3 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {items.map((i) => (
                    <tr
                      key={i.id}
                      onClick={() => router.push(`/reviews/${i.id}`)}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                        {i.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        <div>{formatDate(i.captured_at)}</div>
                        <div className="text-[10px] text-slate-400">{formatTimeAgo(i.captured_at)}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{i.station_id || "STATION-01"}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{i.model}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={i.status} size="sm" />
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${
                            i.defect_count > 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {i.defect_count} defect{i.defect_count === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {i.review_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/reviews/${i.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
