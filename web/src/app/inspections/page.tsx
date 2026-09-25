"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { getInspections } from "@/lib/api/inspections";
import { InspectionListItem } from "@/types/models";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { DEFECT_LABELS } from "@/lib/constants/defects";

export default function InspectionsPage() {
  const router = useRouter();

  const [items, setItems] = useState<InspectionListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [status, setStatus] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [defectClass, setDefectClass] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [stationId, setStationId] = useState<string>("");
  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInspections({
        status: status || undefined,
        model: model || undefined,
        defect_class: defectClass || undefined,
        station_id: stationId || undefined,
        search: search.trim() || undefined,
        limit,
        offset,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Failed to load inspection history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [status, model, defectClass, stationId, limit, offset]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchInspections();
  };

  const handleResetFilters = () => {
    setStatus("");
    setModel("");
    setDefectClass("");
    setStationId("");
    setSearch("");
    setOffset(0);
  };

  const exportCurrentCsv = () => {
    if (items.length === 0) return;
    const headers = ["ID", "Captured At", "Station", "Operator", "Role", "Model", "Status", "Defects", "Review Status"];
    const rows = items.map((i) => [
      i.id,
      i.captured_at,
      i.station_id || "STATION-01",
      i.operator_email || "System",
      i.operator_role || "ENGINEER",
      i.model,
      i.status,
      i.defect_count,
      i.review_status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inspections_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-surface-900">
              Inspection History Archive
            </h1>
            <p className="text-xs text-surface-500 mt-1">
              Synchronized automated optical inspection records from factory lines and stations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCurrentCsv}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-surface-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchInspections}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-sm transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-surface-200 rounded-lg p-4 shadow-sm space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search by source image name, station identifier, or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-50 border border-surface-200 rounded text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
            >
              Search
            </button>
          </form>

          {/* Secondary Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-surface-100">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-surface-500 uppercase tracking-wider mb-1">
                Disposition
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              >
                <option value="">All Dispositions</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-surface-500 uppercase tracking-wider mb-1">
                Defect Category
              </label>
              <select
                value={defectClass}
                onChange={(e) => {
                  setDefectClass(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              >
                <option value="">All Categories</option>
                {Object.entries(DEFECT_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-surface-500 uppercase tracking-wider mb-1">
                Model Architecture
              </label>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              >
                <option value="">All Models</option>
                <option value="yolov8s">YOLOv8s</option>
                <option value="yolov8n">YOLOv8n</option>
                <option value="fasterrcnn">Faster R-CNN</option>
                <option value="retinanet">RetinaNet</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleResetFilters}
                className="w-full py-1.5 px-3 rounded text-xs font-semibold text-surface-600 hover:text-surface-900 bg-surface-100 hover:bg-surface-200 border border-surface-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchInspections} />
            </div>
          ) : loading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={7} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No inspection records found"
                description="No inspections matched your filter criteria. Try adjusting the search term or resetting the filters."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                      <th className="py-2.5 px-3 font-semibold">Inspection ID</th>
                      <th className="py-2.5 px-3 font-semibold">Captured At</th>
                      <th className="py-2.5 px-3 font-semibold">Station</th>
                      <th className="py-2.5 px-3 font-semibold">Operator</th>
                      <th className="py-2.5 px-3 font-semibold">AI Model</th>
                      <th className="py-2.5 px-3 font-semibold">Disposition</th>
                      <th className="py-2.5 px-3 font-semibold">Defects</th>
                      <th className="py-2.5 px-3 font-semibold">Review Status</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {items.map((i) => (
                      <tr
                        key={i.id}
                        onClick={() => router.push(`/inspections/${i.id}`)}
                        className="hover:bg-surface-50/80 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-surface-900">
                          <span className="text-brand-600 hover:underline">{i.id.slice(0, 8)}</span>
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
                        <td className="py-2.5 px-3">
                          {i.operator_email ? (
                            <div className="flex flex-col">
                              <span className="font-mono text-[11px] text-surface-900 font-medium truncate max-w-[130px]" title={i.operator_email}>
                                {i.operator_email}
                              </span>
                              <span className="text-[9px] font-mono uppercase text-brand-700 font-semibold">
                                {i.operator_role || "ENGINEER"}
                              </span>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-surface-400">Station-01</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-surface-600">
                          {i.model}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={i.final_status || i.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {i.defect_count > 0 ? (
                            <span className="font-semibold text-red-600">
                              {i.defect_count} defect{i.defect_count === 1 ? "" : "s"}
                            </span>
                          ) : (
                            <span className="font-medium text-emerald-600">0 defects</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono text-[10px] uppercase text-surface-500">
                            {i.review_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/inspections/${i.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-surface-600 hover:text-surface-900 bg-surface-100 hover:bg-surface-200 border border-surface-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-surface-500" />
                            <span>Workstation</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200 bg-surface-50 text-xs text-surface-600">
                <div className="font-mono text-[11px]">
                  Showing <span className="font-semibold text-surface-900">{total === 0 ? 0 : offset + 1}</span>–
                  <span className="font-semibold text-surface-900">{Math.min(offset + limit, total)}</span> of{" "}
                  <span className="font-semibold text-surface-900">{total}</span> records
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="p-1 rounded border border-surface-200 bg-white text-surface-600 hover:text-surface-900 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-[11px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className="p-1 rounded border border-surface-200 bg-white text-surface-600 hover:text-surface-900 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
