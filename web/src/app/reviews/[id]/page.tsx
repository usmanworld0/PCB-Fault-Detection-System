"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  ShieldCheck,
  Send,
  Eye,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { InspectionImageViewer } from "@/components/inspections/InspectionImageViewer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getInspectionDetail } from "@/lib/api/inspections";
import { submitReview } from "@/lib/api/reviews";
import { InspectionDetail } from "@/types/models";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatDate } from "@/lib/utils";
import { DEFECT_LABELS } from "@/lib/constants/defects";

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [decision, setDecision] = useState<"CONFIRM" | "OVERRIDE_PASS" | "OVERRIDE_FAIL">("CONFIRM");
  const [justification, setJustification] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInspectionDetail(id);
      setInspection(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inspection for review.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const isOverride = decision.startsWith("OVERRIDE");
    if (isOverride && (!justification || justification.trim().length < 5)) {
      setFormError("A comprehensive engineering justification is strictly required when overriding an automated decision.");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        inspection_id: id,
        review_decision: decision,
        justification: justification.trim(),
        notes: notes.trim() || undefined,
      });
      setSuccessMessage("Review decision recorded successfully into system audit trail.");
      fetchDetail();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3 pb-4 border-b border-surface-200">
          <button
            onClick={() => router.push("/reviews")}
            className="p-1.5 rounded bg-white border border-surface-200 text-surface-600 hover:text-surface-900 hover:bg-surface-50 shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-surface-900">
              Quality Verification Workstation
            </h1>
            <p className="text-xs text-surface-500 mt-0.5">
              Review automated defect detections and record formal engineering disposition signoff.
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchDetail} />
        ) : loading || !inspection ? (
          <div className="space-y-5">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Status Compare Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: AI Inference Finding */}
              <div className="bg-white border border-surface-200 rounded-lg p-4 shadow-sm">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500 mb-2">
                  Automated Inference Assessment
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-surface-900">Model Output:</span>
                      <StatusBadge status={inspection.status} />
                    </div>
                    <div className="text-xs text-surface-500 mt-1 font-mono">
                      Evaluated by {inspection.model} · {inspection.defects.length} defect(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Current Final Disposition */}
              <div className="bg-white border border-surface-200 rounded-lg p-4 shadow-sm">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-surface-500 mb-2">
                  Final Quality Status
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-surface-900">Final Disposition:</span>
                      <StatusBadge status={inspection.final_status || inspection.status} />
                    </div>
                    <div className="text-xs text-surface-500 mt-1 font-mono">
                      Status: <span className="font-semibold text-surface-800 uppercase">{inspection.review_status}</span>
                      {inspection.reviewed_by && ` by ${inspection.reviewed_by}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* High-Resolution Optical Inspection Viewer */}
            <InspectionImageViewer
              imageUrl={inspection.image_url}
              annotatedUrl={inspection.annotated_url}
              sourceName={inspection.source}
            />

            {/* Defect Detections Reference Table */}
            <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-surface-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Model Detections Reference</h3>
                  <p className="text-xs text-surface-500 mt-0.5">Defect coordinates flagged during automated inference</p>
                </div>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                  {inspection.defects.length} Defect(s)
                </span>
              </div>
              {inspection.defects.length === 0 ? (
                <div className="p-6 text-center text-xs text-surface-500 bg-surface-50/50">
                  No defect anomalies localized by model.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                        <th className="py-2.5 px-3 font-semibold">#</th>
                        <th className="py-2.5 px-3 font-semibold">Defect</th>
                        <th className="py-2.5 px-3 font-semibold">Confidence</th>
                        <th className="py-2.5 px-3 font-semibold">Severity</th>
                        <th className="py-2.5 px-3 font-semibold">Bounding Box [x1, y1, x2, y2]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {inspection.defects.map((d, idx) => (
                        <tr key={d.id} className="hover:bg-surface-50/80">
                          <td className="py-2.5 px-3 font-mono text-surface-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-surface-900">
                            {DEFECT_LABELS[d.class.toLowerCase()] || d.class}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-brand-700 font-semibold">
                            {(d.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3">
                            <SeverityBadge severity={d.severity} />
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-surface-600">
                            [{d.box_x1}, {d.box_y1}, {d.box_x2}, {d.box_y2}]
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Review Decision Submission Form */}
            <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-200">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <div>
                  <h3 className="text-sm font-bold text-surface-900">Quality Engineer Signoff & Override</h3>
                  <p className="text-xs text-surface-500">Submit authoritative quality disposition to complete audit requirements</p>
                </div>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                  {formError}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Decision Options */}
                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-2 uppercase tracking-wider">
                    Select Review Disposition
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision("CONFIRM")}
                      className={`p-3.5 rounded-lg border text-left transition-colors ${
                        decision === "CONFIRM"
                          ? "bg-brand-50/70 border-brand-500 text-brand-950 shadow-xs"
                          : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5 text-brand-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm AI Result
                      </div>
                      <div className="text-[11px] text-surface-500 mt-1">
                        Ratify the model outcome ({inspection.status}) as final.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("OVERRIDE_PASS")}
                      className={`p-3.5 rounded-lg border text-left transition-colors ${
                        decision === "OVERRIDE_PASS"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                          : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Override to PASS
                      </div>
                      <div className="text-[11px] text-surface-500 mt-1">
                        Classify as acceptable. Requires justification.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("OVERRIDE_FAIL")}
                      className={`p-3.5 rounded-lg border text-left transition-colors ${
                        decision === "OVERRIDE_FAIL"
                          ? "bg-red-50 border-red-500 text-red-950 shadow-xs"
                          : "bg-surface-50 border-surface-200 text-surface-700 hover:bg-surface-100"
                      }`}
                    >
                      <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        Override to FAIL
                      </div>
                      <div className="text-[11px] text-surface-500 mt-1">
                        Classify as defective. Requires justification.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Justification Field */}
                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1.5 uppercase tracking-wider">
                    Engineering Justification{" "}
                    {decision !== "CONFIRM" && <span className="text-red-600">* (Required for Overrides)</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder={
                      decision === "CONFIRM"
                        ? "Optional disposition notes..."
                        : "Describe physical board inspection reason for overriding the automated model assessment..."
                    }
                    className="w-full p-3 bg-white border border-surface-200 rounded text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1.5 uppercase tracking-wider">
                    Internal Engineering Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Batch lot #, optical microscope ref, station operator tag..."
                    className="w-full p-2.5 bg-white border border-surface-200 rounded text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-surface-200">
                  <div className="text-xs text-surface-500 font-mono">
                    Authorized Signer: <span className="font-semibold text-surface-900">{user?.email}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Recording Disposition..." : "Submit Formal Disposition"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
