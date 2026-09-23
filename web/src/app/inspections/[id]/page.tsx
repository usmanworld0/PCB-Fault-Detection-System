"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  Cpu,
  Clock,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  History,
  FileCheck2,
  Sliders,
  Maximize2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { InspectionImageViewer } from "@/components/inspections/InspectionImageViewer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getInspectionDetail } from "@/lib/api/inspections";
import { InspectionDetail } from "@/types/models";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { DEFECT_LABELS } from "@/lib/constants/defects";
import { useAuth } from "@/lib/auth/AuthContext";

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { role } = useAuth();
  const canReview = role === "admin" || role === "engineer";

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInspectionDetail(id);
      setInspection(data);
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

          {canReview && inspection && (
            <Link
              href={`/reviews/${id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span>QA Review / Override</span>
            </Link>
          )}
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
            {/* Review Decision Banner (if reviewed) */}
            {inspection.reviews && inspection.reviews.length > 0 && (
              <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded bg-white text-brand-700 border border-brand-200 shadow-xs shrink-0">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                        Human QA Disposition: {inspection.reviews[0].review_decision}
                      </h4>
                      <span className="text-[11px] text-surface-500 font-mono">
                        {formatDate(inspection.reviews[0].created_at)}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-surface-700">
                      <span className="font-semibold text-surface-900">Reviewer: </span>
                      {inspection.reviews[0].reviewer_email}
                    </div>
                    <div className="mt-1 text-xs text-surface-700">
                      <span className="font-semibold text-surface-900">Engineering Justification: </span>
                      {inspection.reviews[0].justification}
                    </div>
                    {inspection.reviews[0].notes && (
                      <div className="mt-1 text-xs text-surface-600 italic">
                        <span className="font-semibold text-surface-900 not-italic">Operator Notes: </span>
                        {inspection.reviews[0].notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Industrial Metadata Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Station ID</div>
                <div className="mt-1 text-xs font-semibold text-surface-900">{inspection.station_id || "STATION-01"}</div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Source Image</div>
                <div className="mt-1 text-xs font-semibold text-surface-900 truncate" title={inspection.source}>
                  {inspection.source}
                </div>
              </div>
              <div className="p-3 rounded-lg border border-surface-200 bg-white shadow-xs">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500">Model Model</div>
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
                  <div className="text-[10px] font-mono text-surface-500 uppercase font-semibold">4. QA Disposition</div>
                  <div className="text-xs text-surface-900 font-semibold mt-1 uppercase">{inspection.review_status}</div>
                  <div className="text-[10px] text-surface-400 font-mono mt-0.5">
                    {inspection.reviewed_at ? formatDate(inspection.reviewed_at) : "Pending Review"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
