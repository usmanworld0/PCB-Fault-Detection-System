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
  HardDrive,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
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
    const headers = ["ID", "Captured At", "Station", "Model", "Status", "Defects", "Review Status"];
    const rows = items.map((i) => [
      i.id,
      i.captured_at,
      i.station_id || "STATION-01",
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border-line">
          <div>
            <h2 className="text-[1.5rem]/7 lg:text-[1.75rem]/8 font-medium tracking-[-0.72px] text-foreground-primary">
              Inspection History
              <span className="block text-xs lg:text-sm text-foreground-tertiary mt-1 font-normal tracking-normal">
                Search and filter synchronized automated inspection records from all stations
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCurrentCsv}
              disabled={items.length === 0}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium bg-background-secondary hover:bg-background-tertiary text-foreground-primary ring-1 ring-inset ring-border-secondary transition-colors duration-150 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchInspections}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-medium bg-background-secondary hover:bg-background-tertiary text-foreground-primary ring-1 ring-inset ring-border-secondary transition-colors duration-150"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search by source image name, station, or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background-primary ring-1 ring-inset ring-border-secondary rounded-[4px] text-xs text-foreground-primary placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-base font-mono transition-shadow duration-150"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-base hover:bg-brand-vivid text-base-black rounded-[4px] text-xs font-semibold shadow-button-sm transition-colors duration-150"
            >
              Search
            </button>
          </form>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border-line">
            <div>
              <label className="block text-[10px] font-mono font-medium text-foreground-tertiary uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-2.5 py-1.5 bg-background-primary ring-1 ring-inset ring-border-secondary rounded-[4px] text-xs text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand-base font-mono"
              >
                <option value="">All Dispositions</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-medium text-foreground-tertiary uppercase tracking-wider mb-1">
                Defect Class
              </label>
              <select
                value={defectClass}
                onChange={(e) => {
                  setDefectClass(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-2.5 py-1.5 bg-background-primary ring-1 ring-inset ring-border-secondary rounded-[4px] text-xs text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand-base font-mono"
              >
                <option value="">All Defect Classes</option>
                {Object.entries(DEFECT_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-medium text-foreground-tertiary uppercase tracking-wider mb-1">
                Model Architecture
              </label>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-2.5 py-1.5 bg-background-primary ring-1 ring-inset ring-border-secondary rounded-[4px] text-xs text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand-base font-mono"
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
                className="w-full py-1.5 px-3 rounded-[4px] text-xs font-medium text-foreground-secondary hover:text-foreground-primary bg-background-tertiary hover:bg-background-tertiary-invert hover:text-foreground-invert ring-1 ring-inset ring-border-secondary transition-colors duration-150"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm">
          {error ? (
            <ErrorState message={error} onRetry={fetchInspections} />
          ) : loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : items.length === 0 ? (
            <div className="py-16 text-center rounded-[4px] ring-1 ring-inset ring-border-secondary bg-background-primary/40">
              <HardDrive className="w-10 h-10 text-foreground-muted mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground-primary">No inspection records found.</h3>
              <p className="text-xs text-foreground-tertiary mt-1 max-w-md mx-auto leading-relaxed">
                Saved inspection results from the PCB inspection station will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border-line text-[10px] font-mono uppercase tracking-wider text-foreground-tertiary">
                      <th className="py-3 px-3">Inspection ID</th>
                      <th className="py-3 px-3">Captured At</th>
                      <th className="py-3 px-3">Station</th>
                      <th className="py-3 px-3">Model</th>
                      <th className="py-3 px-3">Disposition</th>
                      <th className="py-3 px-3">Defects</th>
                      <th className="py-3 px-3">Review Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-line">
                    {items.map((i) => (
                      <tr
                        key={i.id}
                        onClick={() => router.push(`/inspections/${i.id}`)}
                        className="hover:bg-background-tertiary/40 cursor-pointer transition-colors duration-150"
                      >
                        <td className="py-3 px-3 font-mono text-[11px] text-foreground-secondary">
                          {i.id.slice(0, 8)}...
                        </td>
                        <td className="py-3 px-3 text-foreground-secondary">
                          <div>{formatDate(i.captured_at)}</div>
                          <div className="text-[10px] text-foreground-tertiary font-mono">{formatTimeAgo(i.captured_at)}</div>
                        </td>
                        <td className="py-3 px-3 text-foreground-tertiary font-mono">{i.station_id || "STATION-01"}</td>
                        <td className="py-3 px-3 font-mono text-foreground-secondary">{i.model}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={i.final_status || i.status} size="sm" />
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span
                            className={`font-semibold ${
                              i.defect_count > 0 ? "text-error" : "text-brand-base"
                            }`}
                          >
                            {i.defect_count} defect{i.defect_count === 1 ? "" : "s"}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] text-foreground-tertiary font-mono">
                            {i.review_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/inspections/${i.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] bg-background-tertiary hover:bg-background-tertiary-invert hover:text-foreground-invert ring-1 ring-inset ring-border-secondary text-foreground-primary text-xs transition-colors duration-150"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-line text-xs text-foreground-tertiary">
                <div className="font-mono">
                  Showing {offset + 1}–{Math.min(offset + limit, total)} of {total} inspections
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="p-1.5 rounded-[4px] ring-1 ring-inset ring-border-secondary bg-background-primary text-foreground-secondary hover:text-foreground-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className="p-1.5 rounded-[4px] ring-1 ring-inset ring-border-secondary bg-background-primary text-foreground-secondary hover:text-foreground-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
