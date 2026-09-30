"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Download,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Filter,
  FileSpreadsheet,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { getInspections, deleteInspection, deletePcbInspections } from "@/lib/api/inspections";
import { InspectionListItem } from "@/types/models";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { DEFECT_LABELS } from "@/lib/constants/defects";
import { useAuth } from "@/lib/auth/AuthContext";

interface GroupedPCBItem {
  key: string;
  pcb_id?: string;
  primary_id: string;
  sub_count: number;
  latest_captured_at: string;
  station_id?: string;
  operator_email?: string;
  operator_role?: string;
  model: string;
  overall_status: "PASS" | "FAIL";
  total_defects: number;
  review_status: string;
  sub_inspections: InspectionListItem[];
}

export default function InspectionsPage() {
  const router = useRouter();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [items, setItems] = useState<InspectionListItem[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "pcb";
    id: string;
    pcbId?: string;
    count?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filters & Pagination
  const [status, setStatus] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [defectClass, setDefectClass] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [stationId, setStationId] = useState<string>("");
  const [pcbIdFilter, setPcbIdFilter] = useState<string>("");
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const groupedItems: GroupedPCBItem[] = React.useMemo(() => {
    const map = new Map<string, InspectionListItem[]>();

    for (const item of items) {
      const key = item.pcb_id ? `pcb:${item.pcb_id}` : `insp:${item.id}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }

    const groups: GroupedPCBItem[] = [];

    map.forEach((subItems, key) => {
      subItems.sort((a, b) => (a.image_index ?? 1) - (b.image_index ?? 1));
      const sortedByTime = [...subItems].sort(
        (a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
      );
      const latest = sortedByTime[0];

      const anyFail = subItems.some((i) => (i.final_status || i.status) === "FAIL");
      const totalDefects = subItems.reduce((sum, curr) => sum + (curr.defect_count || 0), 0);
      const pcbId = key.startsWith("pcb:") ? key.slice(4) : undefined;

      groups.push({
        key,
        pcb_id: pcbId,
        primary_id: latest.id,
        sub_count: subItems.length,
        latest_captured_at: latest.captured_at,
        station_id: latest.station_id,
        operator_email: latest.operator_email,
        operator_role: latest.operator_role,
        model: latest.model,
        overall_status: anyFail ? "FAIL" : "PASS",
        total_defects: totalDefects,
        review_status: latest.review_status,
        sub_inspections: subItems,
      });
    });

    groups.sort(
      (a, b) => new Date(b.latest_captured_at).getTime() - new Date(a.latest_captured_at).getTime()
    );

    return groups;
  }, [items]);

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInspections({
        status: status || undefined,
        model: model || undefined,
        defect_class: defectClass || undefined,
        station_id: stationId || undefined,
        pcb_id: pcbIdFilter.trim() || undefined,
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
  }, [status, model, defectClass, stationId, pcbIdFilter, limit, offset]);

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
    setPcbIdFilter("");
    setSearch("");
    setOffset(0);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === "pcb" && deleteTarget.pcbId) {
        await deletePcbInspections(deleteTarget.pcbId);
      } else {
        await deleteInspection(deleteTarget.id);
      }
      setDeleteTarget(null);
      await fetchInspections();
    } catch (err: any) {
      alert("Failed to delete inspection: " + (err.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCurrentCsv = () => {
    if (items.length === 0) return;
    const headers = ["Inspection ID", "PCB ID", "Sub-Image #", "Captured At", "Station", "Operator", "Role", "Model", "Status", "Defects", "Review Status"];
    const rows = items.map((i) => [
      i.id,
      i.pcb_id || "Unassigned",
      i.image_index ?? 1,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
              Inspection History
            </h1>
            <p className="text-xs font-semibold text-[#A0AEC0] mt-0.5">
              Real-time records and automated optical defect inspection logs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCurrentCsv}
              disabled={items.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold text-[#2D3748] bg-white hover:bg-gray-50 border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#4FD1C5]" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={fetchInspections}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold text-[#2D3748] bg-white hover:bg-gray-50 border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#4FD1C5] ${loading ? "animate-spin" : ""}`} />
              <span>REFRESH</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] p-5 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#A0AEC0]" />
              <input
                type="text"
                placeholder="Search by PCB ID, Inspection ID, station, or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F8F9FA] border border-gray-200/80 rounded-[12px] text-xs text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#4FD1C5] hover:bg-[#319795] text-white rounded-[12px] text-xs font-bold uppercase tracking-wider shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-all"
            >
              Search
            </button>
          </form>

          {/* Secondary Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                Filter by PCB ID
              </label>
              <input
                type="text"
                placeholder="e.g. PCB-001"
                value={pcbIdFilter}
                onChange={(e) => {
                  setPcbIdFilter(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                Disposition
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs font-medium text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
              >
                <option value="">All Dispositions</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                Defect Category
              </label>
              <select
                value={defectClass}
                onChange={(e) => {
                  setDefectClass(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs font-medium text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
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
              <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                Model Architecture
              </label>
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs font-medium text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
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
                className="w-full py-2 px-3 rounded-[10px] text-xs font-bold uppercase tracking-wider text-[#718096] hover:text-[#2D3748] bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {/* Data Table */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchInspections} />
            </div>
          ) : loading ? (
            <div className="p-6">
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
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">
                      <th className="py-3.5 px-4 font-bold">PCB Unique ID</th>
                      <th className="py-3.5 px-4 font-bold">Sub-Inspections</th>
                      <th className="py-3.5 px-4 font-bold">Captured At</th>
                      <th className="py-3.5 px-4 font-bold">Station</th>
                      <th className="py-3.5 px-4 font-bold">Operator</th>
                      <th className="py-3.5 px-4 font-bold">AI Model</th>
                      <th className="py-3.5 px-4 font-bold">Overall Disposition</th>
                      <th className="py-3.5 px-4 font-bold">Total Defects</th>
                      <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedItems.map((group) => {
                      const isExpanded = expandedKeys.has(group.key);
                      return (
                        <React.Fragment key={group.key}>
                          <tr
                            className={`hover:bg-gray-50/60 transition-colors ${
                              isExpanded ? "bg-teal-50/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              {group.pcb_id ? (
                                <span className="font-bold text-[#2D3748] bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-[8px] text-xs shadow-2xs inline-flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#4FD1C5]"></span>
                                  {group.pcb_id}
                                </span>
                              ) : (
                                <span className="text-[#718096] text-xs font-semibold">
                                  {group.primary_id.slice(0, 8)} <span className="text-[#A0AEC0] italic text-[10px]">(Single frame)</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => toggleExpand(group.key)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-bold text-[#2D3748] bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors cursor-pointer"
                                title="Click to view all sub-inspections"
                              >
                                <Layers className="w-3.5 h-3.5 text-[#4FD1C5]" />
                                <span>{group.sub_count} {group.sub_count === 1 ? "Sub-Image" : "Sub-Images"}</span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3 h-3 text-[#A0AEC0]" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                                )}
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="text-xs font-bold text-[#2D3748]">{formatDate(group.latest_captured_at)}</div>
                              <div className="text-[10px] text-[#A0AEC0] font-semibold">{formatTimeAgo(group.latest_captured_at)}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-xs font-bold text-[#2D3748] px-2 py-0.5 rounded-[8px] bg-gray-50 border border-gray-200/70">
                                {group.station_id || "STATION-01"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {group.operator_email ? (
                                <div className="flex flex-col">
                                  <span className="text-xs text-[#2D3748] font-bold truncate max-w-[130px]" title={group.operator_email}>
                                    {group.operator_email}
                                  </span>
                                  <span className="text-[10px] uppercase text-[#319795] font-bold tracking-wider">
                                    {group.operator_role || "ENGINEER"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-[#A0AEC0]">Station-01</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold text-[#2D3748]">
                              {group.model}
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={group.overall_status} size="sm" />
                            </td>
                            <td className="py-3.5 px-4">
                              {group.total_defects > 0 ? (
                                <span className="font-bold text-xs text-[#E53E3E] bg-[#FFF5F5] px-2 py-0.5 rounded-[8px]">
                                  {group.total_defects} defect{group.total_defects === 1 ? "" : "s"}
                                </span>
                              ) : (
                                <span className="font-bold text-xs text-[#319795] bg-[#E6FFFA] px-2 py-0.5 rounded-[8px]">0 defects</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(group.key)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-xs font-bold text-[#2D3748] hover:bg-gray-100 bg-gray-50 border border-gray-200/80 transition-colors"
                                  title="View all sub-inspections"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#4FD1C5]" />
                                  <span>{isExpanded ? "Hide" : "Inspect"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/inspections/${group.primary_id}`)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-xs font-bold text-white bg-[#4FD1C5] hover:bg-[#319795] shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors"
                                  title="Open Workstation"
                                >
                                  <span>Workstation</span>
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteTarget(
                                        group.pcb_id
                                          ? { type: "pcb", id: group.primary_id, pcbId: group.pcb_id, count: group.sub_count }
                                          : { type: "single", id: group.primary_id }
                                      )
                                    }
                                    className="p-1.5 rounded-[8px] text-[#A0AEC0] hover:text-[#E53E3E] hover:bg-rose-50 transition-colors"
                                    title={group.pcb_id ? `Delete PCB group (${group.sub_count} scans)` : "Delete inspection"}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Sub-Inspections Expanded View */}
                          {isExpanded && (
                            <tr className="bg-[#F8F9FA]/70 border-b border-gray-100">
                              <td colSpan={9} className="p-3 pl-8">
                                <div className="bg-white border border-gray-200/70 rounded-[12px] p-4 shadow-xs space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                    <div className="flex items-center gap-2">
                                      <Layers className="w-4 h-4 text-[#4FD1C5]" />
                                      <span className="text-xs font-bold text-[#2D3748]">
                                        Sub-Inspections for PCB: <span className="text-[#319795]">{group.pcb_id || group.primary_id.slice(0, 8)}</span>
                                      </span>
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-[#E6FFFA] text-[#319795]">
                                        {group.sub_count} Scans
                                      </span>
                                    </div>
                                    <span className="text-xs text-[#A0AEC0] font-semibold">
                                      Click any sub-inspection below to open in Workstation:
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {group.sub_inspections.map((sub) => {
                                      const isFail = (sub.final_status || sub.status) === "FAIL";
                                      return (
                                        <div
                                          key={sub.id}
                                          onClick={() => router.push(`/inspections/${sub.id}`)}
                                          className="group p-3 bg-white hover:bg-teal-50/20 border border-gray-200/80 hover:border-teal-300 hover:shadow-xs rounded-[12px] cursor-pointer transition-all flex flex-col justify-between"
                                        >
                                          <div>
                                            <div className="relative aspect-4/3 w-full bg-[#1A202C] rounded-[8px] overflow-hidden mb-2 border border-gray-200">
                                              <img
                                                src={sub.annotated_url || sub.image_url}
                                                alt={`Sub-Image #${sub.image_index ?? 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                              />
                                              <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider">
                                                Sub-Img #{sub.image_index ?? 1}
                                              </div>
                                              <div className="absolute top-1 right-1">
                                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-white ${isFail ? "bg-rose-600" : "bg-emerald-600"}`}>
                                                  {sub.final_status || sub.status}
                                                </span>
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs font-bold text-[#2D3748]">
                                              <span className="truncate">{sub.source ? sub.source.slice(0, 16) : `UID: ${sub.id.slice(0, 8)}`}</span>
                                              <span className={sub.defect_count > 0 ? "text-rose-600 font-semibold" : "text-emerald-600"}>
                                                {sub.defect_count} defect{sub.defect_count === 1 ? "" : "s"}
                                              </span>
                                            </div>
                                            <div className="text-[10px] font-semibold text-[#A0AEC0] uppercase tracking-wider mt-0.5">
                                              {formatDate(sub.captured_at)}
                                            </div>
                                          </div>
                                          <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between text-[#4FD1C5] group-hover:text-[#319795] text-[10px] font-bold uppercase tracking-wider">
                                            <span>Inspect in Workstation</span>
                                            <div className="flex items-center gap-1">
                                              {isAdmin && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget({ type: "single", id: sub.id });
                                                  }}
                                                  className="p-1 rounded-[6px] text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                                  title="Delete this sub-inspection"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-gray-100 font-sans">
                {groupedItems.map((group) => {
                  const isExpanded = expandedKeys.has(group.key);
                  return (
                    <div
                      key={group.key}
                      className="p-4 hover:bg-teal-50/10 active:bg-teal-50/20 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {group.pcb_id ? (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-[6px] bg-gray-100 text-[#2D3748] border border-gray-200 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4FD1C5]"></span>
                              PCB: {group.pcb_id}
                            </span>
                          ) : (
                            <span className="font-bold text-xs text-[#2D3748]">
                              #{group.primary_id.slice(0, 8)}
                            </span>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px] bg-teal-50 text-[#4FD1C5] border border-teal-100">
                            {group.sub_count} Sub-Images
                          </span>
                        </div>
                        <StatusBadge status={group.overall_status} size="sm" />
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#718096]">
                        <div className="font-mono text-[11px]">
                          <span>{formatDate(group.latest_captured_at)}</span>
                          <span className="text-[#A0AEC0] ml-1.5 font-semibold">({formatTimeAgo(group.latest_captured_at)})</span>
                        </div>
                        <div className="font-mono text-[11px]">
                          {group.total_defects > 0 ? (
                            <span className="font-semibold text-rose-600">
                              {group.total_defects} flaw{group.total_defects === 1 ? "" : "s"}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">0 defects</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => toggleExpand(group.key)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#4FD1C5] bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-[6px] border border-teal-200 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-[#4FD1C5]" />
                          <span>{isExpanded ? "Hide Sub-Images" : `View Sub-Images (${group.sub_count})`}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/inspections/${group.primary_id}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                          >
                            <span>Workstation</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget(
                                  group.pcb_id
                                    ? { type: "pcb", id: group.primary_id, pcbId: group.pcb_id, count: group.sub_count }
                                    : { type: "single", id: group.primary_id }
                                )
                              }
                              className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                              title="Delete inspection"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded sub-inspections list on mobile */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          {group.sub_inspections.map((sub) => {
                            const isFail = (sub.final_status || sub.status) === "FAIL";
                            return (
                              <div
                                key={sub.id}
                                onClick={() => router.push(`/inspections/${sub.id}`)}
                                className="flex items-center gap-3 p-2.5 bg-gray-50/50 border border-gray-200/80 rounded-[10px] cursor-pointer hover:bg-teal-50/20"
                              >
                                <img
                                  src={sub.annotated_url || sub.image_url}
                                  alt={`Img #${sub.image_index ?? 1}`}
                                  className="w-12 h-12 object-cover rounded-[8px] border border-gray-200 shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-[#2D3748]">
                                      Sub-Image #{sub.image_index ?? 1}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <StatusBadge status={sub.final_status || sub.status} size="sm" />
                                      {isAdmin && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteTarget({ type: "single", id: sub.id });
                                          }}
                                          className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                                          title="Delete sub-inspection"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-[10px] font-semibold text-[#A0AEC0] uppercase tracking-wider mt-0.5">
                                    {sub.defect_count} defect{sub.defect_count === 1 ? "" : "s"} • {formatTimeAgo(sub.captured_at)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-[#F8F9FA]/50 text-xs text-[#718096]">
                <div className="text-xs font-semibold text-[#718096]">
                  Showing <span className="font-bold text-[#2D3748]">{groupedItems.length}</span> PCB units (<span className="font-bold text-[#2D3748]">{total}</span> total scan images)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className="p-1.5 rounded-[8px] border border-gray-200/80 bg-white text-[#2D3748] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-bold text-[#2D3748]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className="p-1.5 rounded-[8px] border border-gray-200/80 bg-white text-[#2D3748] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-[15px] border border-gray-200/70 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#2D3748]">
                  {deleteTarget.type === "pcb"
                    ? "Delete PCB Inspection Group?"
                    : "Delete Inspection Record?"}
                </h3>
                <p className="text-sm text-[#718096] leading-relaxed font-medium">
                  {deleteTarget.type === "pcb" ? (
                    <>
                      Are you sure you want to permanently delete PCB{" "}
                      <span className="font-bold text-[#2D3748]">
                        {deleteTarget.pcbId}
                      </span>{" "}
                      and all{" "}
                      <span className="font-bold text-rose-600">
                        {deleteTarget.count || "associated"}
                      </span>{" "}
                      sub-inspections and defect logs?
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete inspection{" "}
                      <span className="font-bold text-[#2D3748]">
                        #{deleteTarget.id.slice(0, 8)}
                      </span>{" "}
                      and its associated defect data?
                    </>
                  )}
                </p>
              </div>
            </div>

            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-100">
              Warning: This action is permanent and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-[8px] text-xs font-bold uppercase tracking-wider text-[#718096] bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-bold uppercase tracking-wider text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
