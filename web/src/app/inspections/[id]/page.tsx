"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Cpu,
  Clock,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  History,
  Sliders,
  Maximize2,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { InspectionImageViewer } from "@/components/inspections/InspectionImageViewer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getInspectionDetail, getSubInspections } from "@/lib/api/inspections";
import { InspectionDetail, InspectionListItem } from "@/types/models";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { DEFECT_LABELS } from "@/lib/constants/defects";

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [subInspections, setSubInspections] = useState<InspectionListItem[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInspectionDetail(id);
      setInspection(data);

      if (data.pcb_id) {
        setLoadingSub(true);
        try {
          const subs = await getSubInspections(data.pcb_id);
          setSubInspections(subs);
        } catch {
          setSubInspections([]);
        } finally {
          setLoadingSub(false);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve inspection details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Navigation Breadcrumb / Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded bg-white border border-surface-200 text-surface-600 hover:text-surface-900 hover:bg-surface-50 shadow-xs transition-colors"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-surface-900">
                  Inspection Workstation
                </h1>
                {inspection && (
                  <StatusBadge status={inspection.final_status || inspection.status} />
                )}
              </div>
              <p className="text-xs text-surface-500 mt-0.5 font-mono">UID: {id}</p>
            </div>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchDetail} />
        ) : loading || !inspection ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Industrial Metadata Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">PCB Unique ID</div>
                <div className="mt-1 text-xs font-bold text-surface-900 font-mono truncate" title={inspection.pcb_id || "Unassigned"}>
                  {inspection.pcb_id || "Unassigned"}
                </div>
                <div className="text-[9px] font-mono uppercase text-industrial-700 font-semibold mt-0.5">
                  Sub-Image #{inspection.image_index ?? 1} {subInspections.length > 0 ? `of ${subInspections.length}` : ""}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Station ID</div>
                <div className="mt-1 text-xs font-semibold text-surface-900">{inspection.station_id || "STATION-01"}</div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Operator</div>
                <div className="mt-1 text-xs font-semibold text-surface-900 truncate" title={inspection.operator_email || "System"}>
                  {inspection.operator_email ? inspection.operator_email.split("@")[0] : "Station Auto"}
                </div>
                <div className="text-[9px] font-mono uppercase text-brand-700 font-bold">
                  {inspection.operator_role || "ENGINEER"}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Source Image</div>
                <div className="mt-1 text-xs font-semibold text-surface-900 truncate" title={inspection.source}>
                  {inspection.source}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">AI Model</div>
                <div className="mt-1 text-xs font-mono font-semibold text-brand-700">{inspection.model}</div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Timestamp</div>
                <div className="mt-1 text-xs font-mono text-surface-800">{formatDate(inspection.captured_at)}</div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Defects Found</div>
                <div className="mt-1 text-xs font-bold">
                  <span className={inspection.defects.length > 0 ? "text-red-600" : "text-emerald-600"}>
                    {inspection.defects.length} defect{inspection.defects.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Review State</div>
                <div className="mt-1 text-xs font-mono font-semibold uppercase text-surface-700">{inspection.review_status}</div>
              </div>
            </div>

            {/* PCB Sub-Inspections Gallery: Display all sub inspections carried out of that relevant PCB */}
            {inspection.pcb_id && (
              <div className="bg-white border border-surface-200 rounded-lg p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-industrial-600" />
                    <h3 className="text-sm font-bold text-surface-900">
                      Sub-Inspections for PCB: <span className="text-industrial-600 font-mono">{inspection.pcb_id}</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                      {subInspections.length > 0 ? `${subInspections.length} sub-images` : "1 scan"}
                    </span>
                  </div>
                  {subInspections.length > 0 && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-[11px] text-surface-500">Board Overview:</span>
                      {subInspections.some((s) => (s.final_status || s.status) === "FAIL") ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          OVERALL FAIL ({subInspections.filter(s => (s.final_status || s.status) === "FAIL").length} of {subInspections.length} sub-images defective)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          OVERALL PASS (All {subInspections.length} sub-images passed)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-surface-500">
                  Each physical PCB board is inspected across segmented image captures. Click any sub-inspection thumbnail to inspect its defect localization in this workstation:
                </p>

                {loadingSub ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                  </div>
                ) : subInspections.length === 0 ? (
                  <div className="p-3 bg-surface-50 rounded border border-surface-200 text-xs text-surface-500 font-mono">
                    No other sub-inspections recorded for PCB {inspection.pcb_id}.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                    {subInspections.map((sub) => {
                      const isCurrent = sub.id === inspection.id;
                      const isFail = (sub.final_status || sub.status) === "FAIL";
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            if (!isCurrent) router.push(`/inspections/${sub.id}`);
                          }}
                          className={`group relative text-left p-2 rounded-lg border transition-all ${
                            isCurrent
                              ? "bg-industrial-50/70 border-industrial-500 ring-2 ring-industrial-400 shadow-sm"
                              : "bg-surface-50 hover:bg-white border-surface-200 hover:border-surface-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="relative aspect-4/3 w-full bg-surface-900 rounded overflow-hidden border border-surface-200 mb-2">
                            <img
                              src={sub.annotated_url || sub.image_url}
                              alt={`Sub-Image ${sub.image_index ?? 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute top-1 left-1 bg-surface-950/80 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              Sub-Img #{sub.image_index ?? 1}
                            </div>
                            <div className="absolute top-1 right-1">
                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded text-white ${isFail ? "bg-rose-600" : "bg-emerald-600"}`}>
                                {sub.final_status || sub.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-semibold text-surface-900 truncate">
                              {sub.source ? sub.source.slice(0, 14) : `Frame #${sub.image_index}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-surface-500 mt-1">
                            <span className={sub.defect_count > 0 ? "text-rose-600 font-semibold" : "text-emerald-600"}>
                              {sub.defect_count} defect{sub.defect_count === 1 ? "" : "s"}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-industrial-700 bg-industrial-100 px-1 py-0.2 rounded">
                                Viewing
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* High-Resolution Optical Inspection Viewer */}
            <InspectionImageViewer
              imageUrl={inspection.image_url}
              annotatedUrl={inspection.annotated_url}
              sourceName={inspection.source}
            />

            {/* Defect Localization Telemetry Table */}
            <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Localized Defect Anomalies</h3>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Individual defect bounding coordinates and confidence scores evaluated by {inspection.model}
                  </p>
                </div>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                  {inspection.defects.length} Localized Bounding Boxes
                </span>
              </div>

              {inspection.defects.length === 0 ? (
                <div className="py-12 text-center bg-surface-50/50">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-surface-900">Zero Defects Detected</p>
                  <p className="text-[11px] text-surface-500 mt-0.5">
                    This PCB board meets all inspected criteria without defect flags.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                        <th className="py-2.5 px-3 font-semibold">#</th>
                        <th className="py-2.5 px-3 font-semibold">Defect Category</th>
                        <th className="py-2.5 px-3 font-semibold">Confidence</th>
                        <th className="py-2.5 px-3 font-semibold">Severity Rating</th>
                        <th className="py-2.5 px-3 font-semibold">Bounding Box [x1, y1, x2, y2]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {inspection.defects.map((defect, idx) => (
                        <tr key={defect.id} className="hover:bg-surface-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-surface-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-surface-900">
                            {DEFECT_LABELS[defect.class.toLowerCase()] || defect.class}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="text-xs font-semibold text-brand-700">
                              {(defect.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <SeverityBadge severity={defect.severity} />
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-surface-600">
                            [{defect.box_x1}, {defect.box_y1}, {defect.box_x2}, {defect.box_y2}]
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inspection Traceability & Audit Trail */}
            <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                <span>Station Traceability & Ingestion Lifecycle</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded border border-surface-200 bg-surface-50">
                  <div className="text-[10px] font-mono text-surface-500 uppercase font-semibold">1. Station Capture</div>
                  <div className="text-xs text-surface-900 font-semibold mt-1">{inspection.station_id || "STATION-01"}</div>
                  <div className="text-[10px] text-brand-700 font-mono font-medium truncate mt-0.5">
                    {inspection.operator_email || "System"} ({inspection.operator_role || "ENGINEER"})
                  </div>
                  <div className="text-[10px] text-surface-400 font-mono mt-0.5">{formatDate(inspection.captured_at)}</div>
                </div>
                <div className="p-3 rounded border border-surface-200 bg-surface-50">
                  <div className="text-[10px] font-mono text-surface-500 uppercase font-semibold">2. Local Station Ingest</div>
                  <div className="text-xs text-surface-900 font-semibold mt-1">SQLite History</div>
                  <div className="text-[10px] text-surface-400 font-mono mt-0.5">Local ID #{inspection.local_id || "1"}</div>
                </div>
                <div className="p-3 rounded border border-surface-200 bg-surface-50">
                  <div className="text-[10px] font-mono text-surface-500 uppercase font-semibold">3. Cloud Ingestion</div>
                  <div className="text-xs text-emerald-700 font-semibold mt-1">Supabase Synced</div>
                  <div className="text-[10px] text-surface-400 font-mono mt-0.5">{formatDate(inspection.created_at)}</div>
                </div>
                <div className="p-3 rounded border border-surface-200 bg-surface-50">
                  <div className="text-[10px] font-mono text-surface-500 uppercase font-semibold">4. Final Disposition</div>
                  <div className="text-xs text-surface-900 font-semibold mt-1 uppercase">{inspection.final_status || inspection.status}</div>
                  <div className="text-[10px] text-surface-400 font-mono mt-0.5">{inspection.status === "PASS" ? "Automated Pass" : "Defect Detected"}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
