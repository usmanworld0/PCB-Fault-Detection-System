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
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                Quality Compliance & Export Reports
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                AUDIT ARCHIVE
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Generate structured compliance certificates, defect summaries, and downloadable CSV audits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Report</span>
            </button>
            <button
              onClick={fetchReportsList}
              className="p-1.5 rounded bg-white hover:bg-surface-50 text-surface-700 border border-surface-200 shadow-xs transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-surface-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Generate Report Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg border border-surface-200 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-200">
                <h3 className="text-sm font-bold text-surface-900">Generate Quality Report</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1">
                    Report Classification
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Inspection Summary">Inspection Summary</option>
                    <option value="Defect Analysis">Defect Analysis</option>
                    <option value="Quality Report">Quality Report</option>
                    <option value="Model Performance Report">Model Performance Report</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-surface-800 mb-1">
                      Status Filter
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    >
                      <option value="">All Statuses</option>
                      <option value="PASS">PASS Only</option>
                      <option value="FAIL">FAIL Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-800 mb-1">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    >
                      <option value="CSV">CSV Data File</option>
                      <option value="PDF">Printable Report</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-surface-800 mb-1">
                    Model Filter
                  </label>
                  <select
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                  >
                    <option value="">All Models</option>
                    <option value="yolov8s">YOLOv8s</option>
                    <option value="yolov8n">YOLOv8n</option>
                    <option value="fasterrcnn">Faster R-CNN</option>
                    <option value="retinanet">RetinaNet</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 rounded text-xs font-semibold text-surface-700 bg-surface-100 hover:bg-surface-200 border border-surface-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-1.5 rounded text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors disabled:opacity-50"
                  >
                    {generating ? "Compiling..." : "Generate Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reports Archive Table */}
        <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-surface-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Generated Reports Archive</h3>
              <p className="text-xs text-surface-500 mt-0.5">
                Previously generated compliance records available for immediate export and download
              </p>
            </div>
          </div>

          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchReportsList} />
            </div>
          ) : loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileText}
                title="No generated reports yet"
                description="Click 'Generate Report' above to compile inspection summaries or defect analysis."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                    <th className="py-2.5 px-3 font-semibold">Report Title</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Format</th>
                    <th className="py-2.5 px-3 font-semibold">Generated At</th>
                    <th className="py-2.5 px-3 font-semibold">Generated By</th>
                    <th className="py-2.5 px-3 font-semibold">Inspections</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-surface-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-brand-600 shrink-0" />
                        <span>{r.title}</span>
                      </td>
                      <td className="py-2.5 px-3 text-surface-700">{r.report_type}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                          {r.format}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-surface-500 font-mono text-[11px]">{formatDate(r.created_at)}</td>
                      <td className="py-2.5 px-3 text-surface-700 font-mono text-[11px]">{r.created_by_email || "System"}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-surface-800">
                        {r.summary_json?.total_inspections ?? "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={getReportDownloadUrl(r.id)}
                          download
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold shadow-xs transition-colors"
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
