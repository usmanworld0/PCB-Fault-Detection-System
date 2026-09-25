"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, Inbox } from "lucide-react";
import { InspectionListItem } from "@/types/models";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatTimeAgo } from "@/lib/utils";

interface RecentInspectionsTableProps {
  inspections: InspectionListItem[];
}

export function RecentInspectionsTable({ inspections }: RecentInspectionsTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-surface-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Recent Inspection Runs</h3>
          <p className="text-xs text-surface-500 mt-0.5">Automated visual inspection runs synchronized from factory stations</p>
        </div>
        <Link
          href="/inspections"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          <span>All Inspection Logs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {inspections.length === 0 ? (
        <div className="py-12 text-center bg-surface-50/50">
          <Inbox className="w-8 h-8 text-surface-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-surface-700">No inspection records found</p>
          <p className="text-[11px] text-surface-500 mt-1 max-w-sm mx-auto">
            Captured PCB frames saved from desktop inspection stations will be archived here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200 text-[10px] font-mono uppercase tracking-wider text-surface-500">
                <th className="py-2.5 px-3 font-semibold">Inspection ID</th>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Station</th>
                <th className="py-2.5 px-3 font-semibold">Operator</th>
                <th className="py-2.5 px-3 font-semibold">AI Model</th>
                <th className="py-2.5 px-3 font-semibold">Disposition</th>
                <th className="py-2.5 px-3 font-semibold">Defects</th>
                <th className="py-2.5 px-3 font-semibold">Review Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {inspections.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => router.push(`/inspections/${item.id}`)}
                  className="hover:bg-surface-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] font-medium text-surface-900">
                    <span className="text-brand-600 hover:underline">{item.id.slice(0, 8)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-surface-700">
                    <div className="font-mono text-[11px]">{formatDate(item.captured_at)}</div>
                    <div className="text-[10px] text-surface-400 font-mono">{formatTimeAgo(item.captured_at)}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                      {item.station_id || "STATION-01"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {item.operator_email ? (
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px] text-surface-900 font-medium truncate max-w-[130px]" title={item.operator_email}>
                          {item.operator_email}
                        </span>
                        <span className="text-[9px] font-mono uppercase text-brand-700 font-semibold">
                          {item.operator_role || "ENGINEER"}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-surface-400">Station-01</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-surface-600">
                    {item.model}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">
                    {item.defect_count > 0 ? (
                      <span className="font-semibold text-red-600">
                        {item.defect_count} defect{item.defect_count === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="font-medium text-emerald-600">0 defects</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-[10px] uppercase text-surface-500">
                      {item.review_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/inspections/${item.id}`);
                      }}
                      className="p-1 rounded text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors"
                      title="Open Workstation"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
