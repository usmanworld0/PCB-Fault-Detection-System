"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface SeverityChartProps {
  defectsBySeverity: Record<string, number>;
}

export function SeverityChart({ defectsBySeverity }: SeverityChartProps) {
  const critical = defectsBySeverity["Critical"] || 0;
  const moderate = defectsBySeverity["Moderate"] || 0;
  const minor = defectsBySeverity["Minor"] || 0;
  const total = critical + moderate + minor;

  const getPercent = (count: number) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  return (
    <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Severity Classification</h3>
          <p className="text-xs text-surface-500 mt-0.5">Defect criticality breakdown for rework prioritization</p>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
          ISO 9001 QA
        </span>
      </div>

      {/* Progress Bar Stack */}
      <div className="mt-5 h-2 w-full rounded-full bg-surface-100 overflow-hidden flex ring-1 ring-inset ring-surface-200">
        {critical > 0 && (
          <div
            style={{ width: `${getPercent(critical)}%` }}
            className="bg-red-600 transition-all duration-300"
            title={`Critical: ${critical}`}
          />
        )}
        {moderate > 0 && (
          <div
            style={{ width: `${getPercent(moderate)}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`Moderate: ${moderate}`}
          />
        )}
        {minor > 0 && (
          <div
            style={{ width: `${getPercent(minor)}%` }}
            className="bg-sky-600 transition-all duration-300"
            title={`Minor: ${minor}`}
          />
        )}
      </div>

      {/* Detailed rows */}
      <div className="mt-5 space-y-2.5">
        <div className="flex items-center justify-between p-2.5 rounded border border-red-200 bg-red-50/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span className="text-xs font-semibold text-red-800">Critical Failure</span>
            <span className="text-[10px] text-red-600/70 font-mono">(open / short)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-500 font-mono">{getPercent(critical)}%</span>
            <span className="text-xs font-mono font-bold text-red-700 bg-white px-1.5 py-0.5 rounded border border-red-200 min-w-[28px] text-center">
              {critical}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded border border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Moderate Rework</span>
            <span className="text-[10px] text-amber-600/70 font-mono">(spur / mousebite)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-500 font-mono">{getPercent(moderate)}%</span>
            <span className="text-xs font-mono font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200 min-w-[28px] text-center">
              {moderate}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded border border-sky-200 bg-sky-50/50">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="text-xs font-semibold text-sky-800">Minor Anomaly</span>
            <span className="text-[10px] text-sky-600/70 font-mono">(copper / pinhole)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-surface-500 font-mono">{getPercent(minor)}%</span>
            <span className="text-xs font-mono font-bold text-sky-700 bg-white px-1.5 py-0.5 rounded border border-sky-200 min-w-[28px] text-center">
              {minor}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
