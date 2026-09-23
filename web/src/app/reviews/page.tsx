"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Clock, Filter, Eye, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                QA Verification & Review Queue
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                DISPOSITION QUEUE
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Manual verification workstation and engineering signoff for flagged board inspections.
            </p>
          </div>
          <button
            onClick={fetchQueue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-surface-200 pb-3">
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              filterStatus === "PENDING"
                ? "bg-amber-50 text-amber-800 border border-amber-300 shadow-xs"
                : "text-surface-600 hover:text-surface-900 hover:bg-surface-100"
            }`}
          >
            Pending Verification ({filterStatus === "PENDING" ? total : "Queue"})
          </button>
          <button
            onClick={() => setFilterStatus("COMPLETED")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              filterStatus === "COMPLETED"
                ? "bg-brand-50 text-brand-800 border border-brand-300 shadow-xs"
                : "text-surface-600 hover:text-surface-900 hover:bg-surface-100"
            }`}
          >
            Completed Reviews
          </button>
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              filterStatus === "ALL"
                ? "bg-surface-100 text-surface-900 border border-surface-300 shadow-xs"
                : "text-surface-600 hover:text-surface-900 hover:bg-surface-100"
            }`}
          >
            All Inspection Runs
          </button>
        </div>

        {/* Review Table */}
        <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchQueue} />
            </div>
          ) : loading ? (
            <div className="p-4">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={CheckSquare}
                title="No inspections require review."
                description="All synchronized inspection records have been processed and confirmed by automated and engineering workflows."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                    <th className="py-2.5 px-3 font-semibold">Inspection ID</th>
                    <th className="py-2.5 px-3 font-semibold">Captured At</th>
                    <th className="py-2.5 px-3 font-semibold">Station</th>
                    <th className="py-2.5 px-3 font-semibold">AI Model</th>
                    <th className="py-2.5 px-3 font-semibold">Model Finding</th>
                    <th className="py-2.5 px-3 font-semibold">Defect Count</th>
                    <th className="py-2.5 px-3 font-semibold">Review State</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {items.map((i) => (
                    <tr
                      key={i.id}
                      onClick={() => router.push(`/reviews/${i.id}`)}
                      className="hover:bg-surface-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-surface-900">
                        <span className="text-brand-600 hover:underline">{i.id.slice(0, 8)}...</span>
                      </td>
                      <td className="py-2.5 px-3 text-surface-700">
                        <div className="font-mono text-[11px]">{formatDate(i.captured_at)}</div>
                        <div className="text-[10px] text-surface-400 font-mono">{formatTimeAgo(i.captured_at)}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                          {i.station_id || "STATION-01"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-surface-600">{i.model}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={i.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <span
                          className={`font-semibold ${
                            i.defect_count > 0 ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {i.defect_count} defect{i.defect_count === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          {i.review_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/reviews/${i.id}`);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
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
