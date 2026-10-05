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
  Trash2,
  RefreshCw,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { InspectionImageViewer } from "@/components/inspections/InspectionImageViewer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getInspectionDetail, getSubInspections, deleteInspection, deletePcbInspections } from "@/lib/api/inspections";
import { InspectionDetail, InspectionListItem } from "@/types/models";
import { formatDate, formatTimeAgo } from "@/lib/utils";
import { DEFECT_LABELS } from "@/lib/constants/defects";
import { useAuth } from "@/lib/auth/AuthContext";
import { triggerDefectEmailAlert } from "@/lib/services/emailService";

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [subInspections, setSubInspections] = useState<InspectionListItem[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "pcb">("single");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState<string | null>(null);

  const handleSendEmailAlert = async () => {
    if (!inspection) return;
    setIsSendingEmail(true);
    setEmailSentNotice(null);
    try {
      const res = await triggerDefectEmailAlert({
        id: inspection.id,
        pcb_id: inspection.pcb_id,
        station_id: inspection.station_id,
        status: inspection.final_status || inspection.status,
        operator_email: inspection.operator_email,
        model: inspection.model,
        defects: inspection.defects.map((d) => ({
          class: d.class,
          severity: d.severity,
          confidence: d.confidence,
        })),
        captured_at: inspection.captured_at,
      });
      if (res.skipped) {
        setEmailSentNotice(res.message);
      } else {
        setEmailSentNotice("Defect alert email successfully dispatched to admin via SMTP!");
      }
      setTimeout(() => setEmailSentNotice(null), 5000);
    } catch (err: any) {
      alert("Failed to send email alert: " + (err.message || "Unknown error"));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteMode === "pcb" && inspection?.pcb_id) {
        await deletePcbInspections(inspection.pcb_id);
      } else {
        await deleteInspection(id);
      }
      setShowDeleteModal(false);
      router.push("/inspections");
    } catch (err: any) {
      alert("Failed to delete inspection: " + (err.message || "Unknown error"));
      setIsDeleting(false);
    }
  };

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

  const isDefective = inspection && (
    (inspection.final_status || inspection.status) === "FAIL" ||
    (inspection.defects && inspection.defects.length > 0)
  );

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Navigation Breadcrumb / Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-[10px] bg-white border border-gray-200/80 text-[#2D3748] hover:bg-gray-50 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors shrink-0"
              title="Return"
            >
              <ArrowLeft className="w-4 h-4 text-[#4FD1C5]" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
                  Inspection Workstation
                </h1>
                {inspection && (
                  <StatusBadge status={inspection.final_status || inspection.status} />
                )}
              </div>
              <p className="text-xs font-semibold text-[#A0AEC0] mt-0.5">UID: {id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {isDefective && (
              <button
                type="button"
                onClick={handleSendEmailAlert}
                disabled={isSendingEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider text-[#319795] bg-[#E6FFFA] hover:bg-teal-100 border border-teal-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                title="Send SMTP alert email to admin"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{isSendingEmail ? "Sending..." : "Email Alert to Admin"}</span>
              </button>
            )}

            {isAdmin && inspection && (
              <button
                type="button"
                onClick={() => {
                  setDeleteMode("single");
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider text-[#E53E3E] bg-[#FFF5F5] hover:bg-[#FED7D7] transition-colors cursor-pointer"
                title="Delete this inspection"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Inspection</span>
              </button>
            )}
          </div>
        </div>

        {/* Email Alert Sent Confirmation */}
        {emailSentNotice && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{emailSentNotice}</span>
          </div>
        )}

        {error ? (
          <ErrorState message={error} onRetry={fetchDetail} />
        ) : loading || !inspection ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-[15px]" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-[15px]" />
            <Skeleton className="h-64 w-full rounded-[15px]" />
          </div>
        ) : (
          <>
            {/* Industrial Metadata Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">PCB Unique ID</div>
                <div className="mt-1 text-xs font-bold text-[#2D3748] truncate" title={inspection.pcb_id || "Unassigned"}>
                  {inspection.pcb_id || "Unassigned"}
                </div>
                <div className="text-[10px] uppercase text-[#319795] font-bold mt-0.5">
                  Sub-Image #{inspection.image_index ?? 1} {subInspections.length > 0 ? `of ${subInspections.length}` : ""}
                </div>
              </div>
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Station ID</div>
                <div className="mt-1 text-xs font-bold text-[#2D3748]">{inspection.station_id || "STATION-01"}</div>
              </div>
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Operator</div>
                <div className="mt-1 text-xs font-bold text-[#2D3748] truncate" title={inspection.operator_email || "System"}>
                  {inspection.operator_email ? inspection.operator_email.split("@")[0] : "Station Auto"}
                </div>
                <div className="text-[10px] uppercase text-[#319795] font-bold">
                  {inspection.operator_role || "ENGINEER"}
                </div>
              </div>
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Source Image</div>
                <div className="mt-1 text-xs font-bold text-[#2D3748] truncate" title={inspection.source}>
                  {inspection.source}
                </div>
              </div>
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">AI Model</div>
                <div className="mt-1 text-xs font-bold text-[#4FD1C5]">{inspection.model}</div>
              </div>
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Timestamp</div>
                <div className="mt-1 text-xs font-bold text-[#2D3748]">{formatDate(inspection.captured_at)}</div>
              </div>
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Defects Found</div>
                <div className="mt-1 text-xs font-bold">
                  <span className={inspection.defects.length > 0 ? "text-[#E53E3E]" : "text-[#319795]"}>
                    {inspection.defects.length} defect{inspection.defects.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
              <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">Review State</div>
                <div className="mt-1 text-xs font-bold uppercase text-[#2D3748]">{inspection.review_status}</div>
              </div>
            </div>

            {/* PCB Sub-Inspections Gallery: Display all sub inspections carried out of that relevant PCB */}
            {inspection.pcb_id && (
              <div className="bg-white border border-gray-200/70 rounded-[15px] p-5 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#4FD1C5]" />
                    <h3 className="text-sm font-bold text-[#2D3748]">
                      Sub-Inspections for PCB: <span className="text-[#319795]">{inspection.pcb_id}</span>
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[8px] bg-gray-100 text-[#2D3748]">
                      {subInspections.length > 0 ? `${subInspections.length} sub-images` : "1 scan"}
                    </span>
                  </div>
                  {subInspections.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-xs text-[#A0AEC0] font-semibold">Board Overview:</span>
                      {subInspections.some((s) => (s.final_status || s.status) === "FAIL") ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#E53E3E] bg-[#FFF5F5] px-2.5 py-0.5 rounded-[8px]">
                          OVERALL FAIL ({subInspections.filter(s => (s.final_status || s.status) === "FAIL").length} of {subInspections.length} sub-images defective)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#319795] bg-[#E6FFFA] px-2.5 py-0.5 rounded-[8px]">
                          OVERALL PASS (All {subInspections.length} sub-images passed)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#718096]">
                  Each physical PCB board is inspected across segmented image captures. Click any sub-inspection thumbnail to inspect its defect localization in this workstation:
                </p>

                {loadingSub ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-[12px]" />
                    ))}
                  </div>
                ) : subInspections.length === 0 ? (
                  <div className="p-3 bg-[#F8F9FA] rounded-[10px] border border-gray-200/70 text-xs text-[#718096]">
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
                          className={`group relative text-left p-2.5 rounded-[12px] border transition-all ${
                            isCurrent
                              ? "bg-teal-50/40 border-[#4FD1C5] ring-2 ring-[#4FD1C5]/40 shadow-xs"
                              : "bg-[#F8F9FA] hover:bg-white border-gray-200/70 hover:border-gray-300 hover:shadow-xs"
                          }`}
                        >
                          <div className="relative aspect-4/3 w-full bg-slate-900 rounded-[8px] overflow-hidden border border-gray-200/70 mb-2">
                            <img
                              src={sub.annotated_url || sub.image_url}
                              alt={`Sub-Image ${sub.image_index ?? 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute top-1 left-1 bg-slate-950/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]">
                              Sub-Img #{sub.image_index ?? 1}
                            </div>
                            <div className="absolute top-1 right-1">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-[4px] text-white ${isFail ? "bg-[#E53E3E]" : "bg-[#319795]"}`}>
                                {sub.final_status || sub.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#2D3748] truncate">
                              {sub.source ? sub.source.slice(0, 14) : `Frame #${sub.image_index}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#A0AEC0] font-semibold mt-1">
                            <span className={sub.defect_count > 0 ? "text-[#E53E3E] font-bold" : "text-[#319795] font-bold"}>
                              {sub.defect_count} defect{sub.defect_count === 1 ? "" : "s"}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#319795] bg-[#E6FFFA] px-1.5 py-0.5 rounded-[4px]">
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
            <div className="bg-white border border-gray-200/70 rounded-[15px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#2D3748] tracking-tight">Localized Defect Anomalies</h3>
                  <p className="text-xs text-[#A0AEC0] font-semibold mt-0.5">
                    Individual defect bounding coordinates and confidence scores evaluated by {inspection.model}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-[8px] bg-gray-100 text-[#2D3748] self-start sm:self-auto shrink-0">
                  {inspection.defects.length} Localized Bounding Boxes
                </span>
              </div>

              {inspection.defects.length === 0 ? (
                <div className="py-12 text-center bg-[#F8F9FA]/40">
                  <CheckCircle className="w-8 h-8 text-[#319795] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#2D3748]">Zero Defects Detected</p>
                  <p className="text-xs text-[#A0AEC0] font-semibold mt-0.5">
                    This PCB board meets all inspected criteria without defect flags.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[560px]">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">
                        <th className="py-3 px-4 font-bold">#</th>
                        <th className="py-3 px-4 font-bold">Defect Category</th>
                        <th className="py-3 px-4 font-bold">Confidence</th>
                        <th className="py-3 px-4 font-bold">Severity Rating</th>
                        <th className="py-3 px-4 font-bold">Bounding Box [x1, y1, x2, y2]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inspection.defects.map((defect, idx) => (
                        <tr key={defect.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#A0AEC0]">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-[#2D3748]">
                            {DEFECT_LABELS[defect.class.toLowerCase()] || defect.class}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-bold text-[#319795]">
                              {(defect.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <SeverityBadge severity={defect.severity} />
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-[#718096]">
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
            <div className="bg-white border border-gray-200/70 rounded-[15px] p-5 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
              <h3 className="text-sm font-bold text-[#2D3748] mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-[#4FD1C5]" />
                <span>Station Traceability & Ingestion Lifecycle</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-[#F8F9FA]">
                  <div className="text-[10px] text-[#A0AEC0] uppercase font-bold tracking-wider">1. Station Capture</div>
                  <div className="text-xs text-[#2D3748] font-bold mt-1">{inspection.station_id || "STATION-01"}</div>
                  <div className="text-[10px] text-[#319795] font-bold truncate mt-0.5">
                    {inspection.operator_email || "System"} ({inspection.operator_role || "ENGINEER"})
                  </div>
                  <div className="text-[10px] text-[#A0AEC0] font-semibold mt-0.5">{formatDate(inspection.captured_at)}</div>
                </div>
                <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-[#F8F9FA]">
                  <div className="text-[10px] text-[#A0AEC0] uppercase font-bold tracking-wider">2. Local Station Ingest</div>
                  <div className="text-xs text-[#2D3748] font-bold mt-1">SQLite History</div>
                  <div className="text-[10px] text-[#A0AEC0] font-semibold mt-0.5">Local ID #{inspection.local_id || "1"}</div>
                </div>
                <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-[#F8F9FA]">
                  <div className="text-[10px] text-[#A0AEC0] uppercase font-bold tracking-wider">3. Cloud Ingestion</div>
                  <div className="text-xs text-[#319795] font-bold mt-1">Supabase Synced</div>
                  <div className="text-[10px] text-[#A0AEC0] font-semibold mt-0.5">{formatDate(inspection.created_at)}</div>
                </div>
                <div className="p-3.5 rounded-[12px] border border-gray-200/70 bg-[#F8F9FA]">
                  <div className="text-[10px] text-[#A0AEC0] uppercase font-bold tracking-wider">4. Final Disposition</div>
                  <div className="text-xs text-[#2D3748] font-bold mt-1 uppercase">{inspection.final_status || inspection.status}</div>
                  <div className="text-[10px] text-[#A0AEC0] font-semibold mt-0.5">{inspection.status === "PASS" ? "Automated Pass" : "Defect Detected"}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-[15px] border border-gray-200/70 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#2D3748]">
                  Delete Inspection Record?
                </h3>
                <p className="text-sm text-[#718096] leading-relaxed">
                  Are you sure you want to permanently delete this inspection (UID:{" "}
                  <span className="font-bold text-[#2D3748]">{id.slice(0, 8)}</span>)
                  and its associated defect data?
                </p>
              </div>
            </div>

            {inspection?.pcb_id && subInspections.length > 1 && (
              <div className="p-3 rounded-[10px] border border-gray-200 bg-[#F8F9FA] space-y-2">
                <p className="text-xs font-bold text-[#2D3748]">
                  This inspection belongs to PCB group: <span className="font-bold">{inspection.pcb_id}</span> ({subInspections.length} scans)
                </p>
                <div className="space-y-1.5 text-xs text-[#718096]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === "single"}
                      onChange={() => setDeleteMode("single")}
                      className="text-[#4FD1C5] focus:ring-[#4FD1C5]"
                    />
                    <span>Delete only this scan image</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-rose-600 font-bold">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteMode === "pcb"}
                      onChange={() => setDeleteMode("pcb")}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Delete entire PCB group ({subInspections.length} scans)</span>
                  </label>
                </div>
              </div>
            )}

            <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-[8px] border border-rose-100">
              Warning: This action is permanent and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-[8px] text-xs font-bold uppercase tracking-wider text-[#718096] bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
