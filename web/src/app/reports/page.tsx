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
import { getReports, generateReport, downloadReport } from "@/lib/api/reports";
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#2D3748]">
                Quality Reports
              </h1>
            </div>
            <p className="text-xs font-semibold text-[#A0AEC0] mt-0.5">
              Generate and download inspection summary reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider bg-[#4FD1C5] hover:bg-[#319795] text-white shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Report</span>
            </button>
            <button
              onClick={fetchReportsList}
              className="p-2 rounded-[10px] bg-white hover:bg-gray-50 text-[#2D3748] border border-gray-200/80 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#4FD1C5] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Generate Report Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-[15px] border border-gray-200/70 bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-[#2D3748]">Generate Quality Report</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#A0AEC0] hover:text-[#2D3748] hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-2.5 rounded-[10px] bg-red-50 border border-red-200 text-[#E53E3E] text-xs font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                    Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                    Report Classification
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs font-medium text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
                  >
                    <option value="Inspection Summary">Inspection Summary</option>
                    <option value="Defect Analysis">Defect Analysis</option>
                    <option value="Quality Report">Quality Report</option>
                    <option value="Model Performance Report">Model Performance Report</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                      Status Filter
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs font-medium text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
                    >
                      <option value="">All Statuses</option>
                      <option value="PASS">PASS Only</option>
                      <option value="FAIL">FAIL Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                      Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs font-medium text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
                    >
                      <option value="CSV">CSV Data File</option>
                      <option value="PDF">Printable Report</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                    Model Filter
                  </label>
                  <select
                    value={modelFilter}
                    onChange={(e) => setModelFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200/80 rounded-[10px] text-xs font-medium text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5]"
                  >
                    <option value="">All Models</option>
                    <option value="yolov8s">YOLOv8s</option>
                    <option value="yolov8n">YOLOv8n</option>
                    <option value="fasterrcnn">Faster R-CNN</option>
                    <option value="retinanet">RetinaNet</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider text-[#718096] bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-4 py-2 rounded-[10px] text-xs font-bold uppercase tracking-wider bg-[#4FD1C5] hover:bg-[#319795] text-white shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors disabled:opacity-50"
                  >
                    {generating ? "Compiling..." : "Generate Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reports Archive Table */}
        <div className="bg-white border border-gray-200/70 rounded-[15px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#2D3748] tracking-tight">Generated Reports Archive</h3>
              <p className="text-xs text-[#A0AEC0] font-semibold mt-0.5">
                Previously generated compliance records available for immediate export and download
              </p>
            </div>
          </div>

          {error ? (
            <div className="p-6">
              <ErrorState message={error} onRetry={fetchReportsList} />
            </div>
          ) : loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-[10px]" />
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
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">
                      <th className="py-3.5 px-4 font-bold">Report Title</th>
                      <th className="py-3.5 px-4 font-bold">Type</th>
                      <th className="py-3.5 px-4 font-bold">Format</th>
                      <th className="py-3.5 px-4 font-bold">Generated At</th>
                      <th className="py-3.5 px-4 font-bold">Generated By</th>
                      <th className="py-3.5 px-4 font-bold">Inspections</th>
                      <th className="py-3.5 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#2D3748] flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-[#4FD1C5] shrink-0" />
                          <span>{r.title}</span>
                        </td>
                        <td className="py-3.5 px-4 text-[#718096] font-medium">{r.report_type}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[8px] bg-gray-100 text-[#2D3748]">
                            {r.format}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#A0AEC0] font-semibold">{formatDate(r.created_at)}</td>
                        <td className="py-3.5 px-4 text-[#2D3748] font-bold">{r.created_by_email || "System"}</td>
                        <td className="py-3.5 px-4 font-bold text-[#2D3748]">
                          {r.summary_json?.total_inspections ?? "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => downloadReport(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-gray-50 hover:bg-gray-100 text-[#2D3748] border border-gray-200/80 text-xs font-bold shadow-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-[#4FD1C5]" />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100 font-sans">
                {reports.map((r) => (
                  <div key={r.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <FileCheck className="w-4 h-4 text-[#4FD1C5] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-[#2D3748]">{r.title}</div>
                          <div className="text-[10px] text-[#A0AEC0] font-bold uppercase tracking-wider mt-0.5">
                            {r.report_type} · {formatDate(r.created_at)}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-gray-100 text-[#2D3748] uppercase tracking-wider shrink-0">
                        {r.format}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="text-xs text-[#718096] font-medium">
                        Inspections: <span className="font-bold text-[#2D3748]">{r.summary_json?.total_inspections ?? "—"}</span>
                      </div>
                      <button
                        onClick={() => downloadReport(r)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#4FD1C5] hover:bg-[#319795] text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_2px_4px_rgba(79,209,197,0.3)] transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
