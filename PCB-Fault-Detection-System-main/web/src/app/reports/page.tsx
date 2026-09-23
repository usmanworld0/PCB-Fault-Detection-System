"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Plus,
  RefreshCw,
  FileCheck,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getReports, generateReport, getReportDownloadUrl } from "@/lib/api/reports";
import { Report } from "@/types/models";
import { formatDate } from "@/lib/utils";
import { DEFECT_LABELS } from "@/lib/constants/defects";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Report Generator Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("Weekly PCB Quality Summary");
  const [reportType, setReportType] = useState("Inspection Summary");
  const [format, setFormat] = useState("CSV");
  const [statusFilter, setStatusFilter] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  const [generating, setGenerating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchReportsList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err: any) {
      setError(err.message || "Failed to load reports archive.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsList();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setGenerating(true);

    try {
      await generateReport({
        title,
        report_type: reportType,
        format,
        status: statusFilter || undefined,
        model: modelFilter || undefined,
      });
      setIsModalOpen(false);
      fetchReportsList();
    } catch (err: any) {
      setFormError(err.message || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Quality Reports & Exports</h2>
            <p className="text-xs text-slate-400 mt-1">
              Generate structured compliance certificates, defect summaries, and downloadable CSV audits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-900/40 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
            <button
              onClick={fetchReportsList}
              className="p-1.5 rounded-lg border border-slate-800 bg-surface-100 hover:bg-surface-50 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Generate Report Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0E1422] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <h3 className="text-base font-semibold text-white">Generate Quality Report</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Report Classification
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Inspection Summary">Inspection Summary</option>
                    <option value="Defect Analysis">Defect Analysis</option>
                    <option value="Quality Report">Quality Report</option>
                    <option value="Model Performance Report">Model Performance Report</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status Filter
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="PASS">PASS Only</option>
                      <option value="FAIL">FAIL Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="CSV">CSV Data File</option>
                      <option value="PDF">Printable Report</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Model Filter
                  </label>
                  <select
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Models</option>
                    <option value="yolov8s">YOLOv8s</option>
                    <option value="yolov8n">YOLOv8n</option>
                    <option value="fasterrcnn">Faster R-CNN</option>
                    <option value="retinanet">RetinaNet</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/50 transition disabled:opacity-50"
                  >
                    {generating ? "Compiling Report..." : "Generate Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reports Archive Table */}
        <div className="rounded-xl border border-slate-800 bg-[#0E1422] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Generated Reports Archive</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Previously generated compliance files available for direct download
              </p>
            </div>
          </div>

          {error ? (
            <ErrorState message={error} onRetry={fetchReportsList} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-lg">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">No generated reports yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click &quot;Generate Report&quot; above to compile inspection summaries or defect analysis.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Report Title</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Format</th>
                    <th className="py-3 px-3">Generated At</th>
                    <th className="py-3 px-3">Generated By</th>
                    <th className="py-3 px-3">Inspections</th>
                    <th className="py-3 px-3 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-400" />
                        <span>{r.title}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{r.report_type}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {r.format}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{formatDate(r.created_at)}</td>
                      <td className="py-3 px-3 text-slate-300">{r.created_by_email || "System"}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {r.summary_json?.total_inspections ?? "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a
                          href={getReportDownloadUrl(r.id)}
                          download
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
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
