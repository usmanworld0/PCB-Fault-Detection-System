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
      setFormError("A comprehensive engineering justification is strictly required when overriding an AI result.");
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
      setSuccessMessage("Review decision recorded successfully into audit log.");
      fetchDetail();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
          <button
            onClick={() => router.push("/reviews")}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Quality Verification Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review AI defect detections and confirm or override final board disposition
            </p>
          </div>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={fetchDetail} />
        ) : loading || !inspection ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Result vs Review Outcome Compare Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: AI Inference Finding */}
              <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Automated Model Assessment
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">AI Verdict:</span>
                      <StatusBadge status={inspection.status} />
                    </div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">
                      Evaluated by {inspection.model} · {inspection.defects.length} defect(s)
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Current Final Disposition */}
              <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Final Quality Status
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">Final Disposition:</span>
                      <StatusBadge status={inspection.final_status || inspection.status} />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Status: <span className="font-semibold text-amber-400">{inspection.review_status}</span>
                      {inspection.reviewed_by && ` by ${inspection.reviewed_by}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* High-Resolution Dual Image Viewer */}
            <InspectionImageViewer
              imageUrl={inspection.image_url}
              annotatedUrl={inspection.annotated_url}
              sourceName={inspection.source}
            />

            {/* Defect Detections Reference Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-100 mb-3">Model Detections Reference</h3>
              {inspection.defects.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-900 rounded-lg">
                  No defect anomalies localized by model.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Defect</th>
                        <th className="py-2.5 px-3">Confidence</th>
                        <th className="py-2.5 px-3">Severity</th>
                        <th className="py-2.5 px-3">Coordinates [x1, y1, x2, y2]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {inspection.defects.map((d, idx) => (
                        <tr key={d.id}>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-200">
                            {DEFECT_LABELS[d.class.toLowerCase()] || d.class}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-400">
                            {(d.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3">
                            <SeverityBadge severity={d.severity} />
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
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
            <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Quality Engineer Signoff & Override</h3>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* Decision Options */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Select Review Disposition
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision("CONFIRM")}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        decision === "CONFIRM"
                          ? "bg-indigo-600/15 border-indigo-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        Confirm AI Result
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Ratify the model outcome ({inspection.status}) as final.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("OVERRIDE_PASS")}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        decision === "OVERRIDE_PASS"
                          ? "bg-emerald-600/15 border-emerald-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Override to PASS
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Classify as acceptable. Requires justification.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecision("OVERRIDE_FAIL")}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        decision === "OVERRIDE_FAIL"
                          ? "bg-rose-600/15 border-rose-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        Override to FAIL
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Classify as defective. Requires justification.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Justification Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Engineering Justification{" "}
                    {decision !== "CONFIRM" && <span className="text-rose-400">* (Required)</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder={
                      decision === "CONFIRM"
                        ? "Optional justification notes..."
                        : "Describe physical board inspection reason for overriding the AI model..."
                    }
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Internal Engineering Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Batch lot #, optical microscope ref, station operator tag..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Signing as: <span className="font-semibold text-slate-200">{user?.email}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-900/50 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Recording Disposition..." : "Submit Final Disposition"}</span>
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
