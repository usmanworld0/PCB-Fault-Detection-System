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
import { DEFECT_LABELS, DEFECT_COLORS } from "@/lib/constants/defects";

interface DefectBarChartProps {
  defectsByClass: Record<string, number>;
}

export function DefectBarChart({ defectsByClass }: DefectBarChartProps) {
  const classes = ["open", "short", "mousebite", "spur", "copper", "pinhole"];
  const data = classes.map((cls) => ({
    key: cls,
    name: DEFECT_LABELS[cls] || cls,
    count: defectsByClass[cls] || 0,
    color: DEFECT_COLORS[cls] || "#18e299",
  }));

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">Defect Distribution by Category</h3>
          <p className="text-xs text-foreground-tertiary mt-0.5">Defect occurrences across the 6 defect classes</p>
        </div>
        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-[2px] bg-background-tertiary text-foreground-secondary ring-1 ring-inset ring-border-secondary">
          {total} Total Defects
        </span>
      </div>

      <div className="h-64 w-full">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-foreground-tertiary">
            No defect occurrences detected
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-line)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--foreground-muted)"
                fontSize={11}
                tickLine={false}
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background-secondary)",
                  borderColor: "var(--border-line)",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "var(--foreground-primary)",
                }}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
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
