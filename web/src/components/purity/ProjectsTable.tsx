"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, MoreVertical, Layers } from "lucide-react";
import { Card, CardHeader, CardBody } from "./Card";
import { cn } from "@/lib/utils";

export interface ProjectTableRow {
  id: string;
  name: string;
  subName?: string;
  icon?: React.ReactNode;
  members: { name: string; avatar?: string }[];
  budget: string;
  progression: number;
  statusBadge?: React.ReactNode;
  onClickHref?: string;
}

interface RecentInspectionsTableCardProps {
  title?: string;
  amount?: number | string;
  amountSubtitle?: string;
  captions?: string[];
  data: ProjectTableRow[];
  className?: string;
}

export function RecentInspectionsTableCard({
  title = "Recent PCB Inspections",
  amount = 30,
  amountSubtitle = "passed this month.",
  captions = ["INSPECTION & PCB ID", "OPERATOR", "AI MODEL", "DISPOSITION & YIELD"],
  data,
  className,
}: RecentInspectionsTableCardProps) {
  return (
    <Card className={cn("p-5 sm:p-6 overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex flex-col">
          <h4 className="text-base sm:text-lg font-bold text-[#2D3748] mb-1">
            {title}
          </h4>
          <div className="flex items-center gap-1.5 text-xs text-[#A0AEC0]">
            <CheckCircle2 className="w-4 h-4 text-[#4FD1C5]" />
            <span>
              <strong className="text-[#2D3748]">{amount}</strong> {amountSubtitle}
            </span>
          </div>
        </div>

        <button
          className="p-1.5 text-[#A0AEC0] hover:text-[#2D3748] rounded-lg hover:bg-gray-50 transition-colors"
          title="More Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </CardHeader>

      <CardBody className="p-0 overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-gray-100">
              {captions.map((caption, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]",
                    idx === 0 ? "pl-1 pr-4" : "px-4",
                    idx === captions.length - 1 ? "pr-1 text-right" : ""
                  )}
                >
                  {caption}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/80">
            {data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50/70 transition-colors group cursor-pointer"
              >
                {/* PCB ID & Inspection Column */}
                <td className="py-3 pl-1 pr-4">
                  <Link
                    href={row.onClickHref || "#"}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-[10px] bg-teal-50 border border-teal-100 flex items-center justify-center text-[#4FD1C5] shrink-0 group-hover:bg-[#4FD1C5] group-hover:text-white transition-colors">
                      {row.icon || <Layers className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-[#2D3748] group-hover:text-[#4FD1C5] transition-colors truncate">
                        {row.name}
                      </span>
                      {row.subName && (
                        <span className="text-[11px] text-[#A0AEC0] font-mono truncate">
                          {row.subName}
                        </span>
                      )}
                    </div>
                  </Link>
                </td>

                {/* Operator Stack Column */}
                <td className="py-3 px-4">
                  <div className="flex items-center -space-x-2">
                    {row.members.slice(0, 4).map((member, mIdx) => (
                      <div
                        key={mIdx}
                        className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#2D3748] shadow-2xs overflow-hidden"
                        title={member.name}
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                    {row.members.length > 4 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-teal-50 text-[#4FD1C5] flex items-center justify-center text-[10px] font-bold">
                        +{row.members.length - 4}
                      </div>
                    )}
                  </div>
                </td>

                {/* Model Column */}
                <td className="py-3 px-4 font-bold text-xs text-[#2D3748]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{row.budget}</span>
                    {row.statusBadge}
                  </div>
                </td>

                {/* Progression & Yield Column */}
                <td className="py-3 pr-1 pl-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-xs text-[#4FD1C5] mb-1">
                      {row.progression}%
                    </span>
                    <div className="w-24 sm:w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-[#4FD1C5]"
                        style={{ width: `${row.progression}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}

// Backwards compatibility alias
export const ProjectsTable = RecentInspectionsTableCard;
