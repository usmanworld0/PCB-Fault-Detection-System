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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Inspection Record</h2>
                {inspection && (
                  <StatusBadge status={inspection.final_status || inspection.status} />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{id}</p>
            </div>
          </div>

          {canReview && inspection && (
            <Link
              href={`/reviews/${id}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-900/50 transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Review / Override Disposition</span>
            </Link>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchDetail} />
        ) : loading || !inspection ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Review Decision Banner (if reviewed) */}
            {inspection.reviews && inspection.reviews.length > 0 && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        Human Quality Review: {inspection.reviews[0].review_decision}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(inspection.reviews[0].created_at)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-200">
                      <span className="font-semibold text-slate-400">Reviewer: </span>
                      {inspection.reviews[0].reviewer_email}
                    </div>
                    <div className="mt-1 text-xs text-slate-200">
                      <span className="font-semibold text-slate-400">Justification: </span>
                      {inspection.reviews[0].justification}
                    </div>
                    {inspection.reviews[0].notes && (
                      <div className="mt-1 text-xs text-slate-400 italic">
                        <span className="font-semibold text-slate-400 not-italic">Notes: </span>
                        {inspection.reviews[0].notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1422]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Station</div>
                <div className="mt-1 text-xs font-semibold text-white">{inspection.station_id || "STATION-01"}</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1422]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Source Item</div>
                <div className="mt-1 text-xs font-semibold text-white truncate" title={inspection.source}>
                  {inspection.source}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1422]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Model</div>
                <div className="mt-1 text-xs font-semibold text-indigo-400 font-mono">{inspection.model}</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1422]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Captured At</div>
                <div className="mt-1 text-xs font-medium text-slate-200">{formatDate(inspection.captured_at)}</div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1422]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Defect Count</div>
                <div className="mt-1 text-xs font-bold text-white">
                  <span className={inspection.defects.length > 0 ? "text-rose-400" : "text-emerald-400"}>
                    {inspection.defects.length} defect{inspection.defects.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1422]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Review State</div>
                <div className="mt-1 text-xs font-semibold text-slate-300">{inspection.review_status}</div>
              </div>
            </div>

            {/* High-Resolution Dual Image Viewer */}
            <InspectionImageViewer
              imageUrl={inspection.image_url}
              annotatedUrl={inspection.annotated_url}
              sourceName={inspection.source}
            />

            {/* Defect Detections Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Localized Defect Anomalies</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Individual defect coordinates and confidence scores evaluated by {inspection.model}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {inspection.defects.length} Bounding Boxes
                </span>
              </div>

              {inspection.defects.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-200">Zero Defects Detected</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    This PCB board meets all inspected criteria without defect flags.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3">Defect Category</th>
                        <th className="py-3 px-3">Confidence</th>
                        <th className="py-3 px-3">Severity Rating</th>
                        <th className="py-3 px-3">Bounding Box (x1, y1, x2, y2)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {inspection.defects.map((defect, idx) => (
                        <tr key={defect.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-medium text-slate-200">
                            {DEFECT_LABELS[defect.class.toLowerCase()] || defect.class}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-mono text-xs font-semibold text-indigo-400">
                              {(defect.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <SeverityBadge severity={defect.severity} />
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-300">
                            [{defect.box_x1}, {defect.box_y1}, {defect.box_x2}, {defect.box_y2}]
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Inspection Lifecycle Audit Trail */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Inspection Lifecycle Trail</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">1. Captured at Station</div>
                  <div className="text-xs text-white font-medium mt-1">{inspection.station_id || "STATION-01"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(inspection.captured_at)}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">2. Local Offline Save</div>
                  <div className="text-xs text-white font-medium mt-1">SQLite History</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Local ID #{inspection.local_id || "1"}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">3. Cloud Ingest</div>
                  <div className="text-xs text-emerald-400 font-medium mt-1">Supabase Synced</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(inspection.created_at)}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">4. Review Disposition</div>
                  <div className="text-xs text-white font-medium mt-1">{inspection.review_status}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
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
