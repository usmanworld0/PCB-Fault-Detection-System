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
    <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm">
      <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">Severity Breakdown</h3>
      <p className="text-xs text-foreground-tertiary mt-0.5">Criticality classification of detected anomalies</p>

      {/* Progress Bar Stack */}
      <div className="mt-4 h-2.5 w-full rounded-full bg-background-tertiary overflow-hidden flex">
        {critical > 0 && (
          <div
            style={{ width: `${getPercent(critical)}%` }}
            className="bg-error transition-all duration-300"
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
            className="bg-sky-500 transition-all duration-300"
            title={`Minor: ${minor}`}
          />
        )}
      </div>

      {/* Detailed rows */}
      <div className="mt-5 space-y-2.5">
        <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-error/10 ring-1 ring-inset ring-error/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-error" />
            <span className="text-xs font-mono font-medium text-error">Critical</span>
            <span className="text-[10px] text-foreground-tertiary font-mono">(open / short)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground-tertiary font-mono">{getPercent(critical)}%</span>
            <span className="text-xs font-mono font-bold text-foreground-primary min-w-[24px] text-right">{critical}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-amber-500/10 ring-1 ring-inset ring-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono font-medium text-amber-400">Moderate</span>
            <span className="text-[10px] text-foreground-tertiary font-mono">(spur / mousebite)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground-tertiary font-mono">{getPercent(moderate)}%</span>
            <span className="text-xs font-mono font-bold text-foreground-primary min-w-[24px] text-right">{moderate}</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-[4px] bg-sky-500/10 ring-1 ring-inset ring-sky-500/20">
          <div className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-mono font-medium text-sky-400">Minor</span>
            <span className="text-[10px] text-foreground-tertiary font-mono">(copper / pinhole)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground-tertiary font-mono">{getPercent(minor)}%</span>
            <span className="text-xs font-mono font-bold text-foreground-primary min-w-[24px] text-right">{minor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
