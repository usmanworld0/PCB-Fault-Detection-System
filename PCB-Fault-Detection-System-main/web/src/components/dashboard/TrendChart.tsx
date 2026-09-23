"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendItem } from "@/types/models";

interface TrendChartProps {
  data: TrendItem[];
}

export function TrendChart({ data }: TrendChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: item.date ? item.date.slice(5) : "",
  }));

  return (
    <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">30-Day Inspection & Defect Trend</h3>
          <p className="text-xs text-foreground-tertiary mt-0.5">Daily volume of inspections vs defects localized</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#18e299" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#18e299" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87171" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f87171" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-line)" vertical={false} />
            <XAxis dataKey="displayDate" stroke="var(--foreground-muted)" fontSize={11} tickLine={false} />
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
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="inspections"
              name="Inspections"
              stroke="#18e299"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInspections)"
            />
            <Area
              type="monotone"
              dataKey="defects"
              name="Defects"
              stroke="#f87171"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorDefects)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
