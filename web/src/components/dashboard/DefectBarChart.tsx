"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DEFECT_LABELS } from "@/lib/constants/defects";

interface DefectBarChartProps {
  defectsByClass: Record<string, number>;
}

// Crisp industrial palette for defect classifications
const INDUSTRIAL_CLASS_COLORS: Record<string, string> = {
  open: "#dc2626",      // Critical Red
  short: "#ea580c",     // Deep Orange
  mousebite: "#d97706", // Amber
  spur: "#7c3aed",      // Violet
  copper: "#059669",    // Emerald
  pinhole: "#0284c7",   // Steel Blue
};

export function DefectBarChart({ defectsByClass }: DefectBarChartProps) {
  const classes = ["open", "short", "mousebite", "spur", "copper", "pinhole"];
  const data = classes.map((cls) => ({
    key: cls,
    name: DEFECT_LABELS[cls] || cls,
    count: defectsByClass[cls] || 0,
    color: INDUSTRIAL_CLASS_COLORS[cls] || "#64748b",
  }));

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Defect Frequency Distribution</h3>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
              PARETO QA
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-0.5">Classification breakdown across 6 anomaly types</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-surface-600">
            Total Anomalies: <span className="font-semibold text-surface-900">{total}</span>
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-surface-400 bg-surface-50/50 rounded border border-dashed border-surface-200">
            No defect occurrences recorded in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(241, 245, 249, 0.6)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-white border border-surface-200 rounded shadow-md px-3 py-2 text-xs">
                        <div className="font-semibold text-surface-900">{item.name}</div>
                        <div className="text-surface-600 mt-0.5 font-mono">
                          Count: <span className="font-semibold text-surface-900">{item.count}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={48}>
                {data.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
