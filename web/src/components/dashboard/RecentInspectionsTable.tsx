"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, HardDrive } from "lucide-react";
import { InspectionListItem } from "@/types/models";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatDate, formatTimeAgo } from "@/lib/utils";

interface RecentInspectionsTableProps {
  inspections: InspectionListItem[];
}

export function RecentInspectionsTable({ inspections }: RecentInspectionsTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">Recent Quality Inspections</h3>
          <p className="text-xs text-foreground-tertiary mt-0.5">Latest synchronized PCB inspection runs</p>
        </div>
        <Link
          href="/inspections"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-base hover:text-brand-vivid transition-colors duration-150"
        >
          <span>View All History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {inspections.length === 0 ? (
        <div className="py-12 text-center rounded-[4px] ring-1 ring-inset ring-border-secondary bg-background-primary/40">
          <HardDrive className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
          <p className="text-xs font-medium text-foreground-secondary">No inspection records found.</p>
          <p className="text-[11px] text-foreground-tertiary mt-1 max-w-sm mx-auto">
            Saved inspection results from the PCB inspection station will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-line text-[10px] font-mono uppercase tracking-wider text-foreground-tertiary">
                <th className="py-3 px-3">Inspection ID</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Station</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Disposition</th>
                <th className="py-3 px-3">Defects</th>
                <th className="py-3 px-3">Review</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {inspections.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => router.push(`/inspections/${item.id}`)}
                  className="hover:bg-background-tertiary/40 cursor-pointer transition-colors duration-150"
                >
                  <td className="py-3 px-3 font-mono text-[11px] text-foreground-secondary">
                    {item.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-3 text-foreground-secondary">
                    <div>{formatDate(item.captured_at)}</div>
                    <div className="text-[10px] text-foreground-tertiary font-mono">{formatTimeAgo(item.captured_at)}</div>
                  </td>
                  <td className="py-3 px-3 text-foreground-tertiary font-mono">
                    {item.station_id || "STATION-01"}
                  </td>
                  <td className="py-3 px-3 font-mono text-foreground-secondary">{item.model}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`font-semibold ${
                        item.defect_count > 0 ? "text-error" : "text-brand-base"
                      }`}
                    >
                      {item.defect_count} defect{item.defect_count === 1 ? "" : "s"}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] text-foreground-tertiary font-mono">
                      {item.review_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/inspections/${item.id}`);
                      }}
                      className="p-1 rounded-[2px] text-foreground-tertiary hover:text-foreground-primary hover:bg-background-tertiary transition-colors duration-150"
                      title="Inspect"
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
