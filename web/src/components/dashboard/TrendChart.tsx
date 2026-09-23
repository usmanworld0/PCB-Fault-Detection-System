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
    <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-surface-900 tracking-tight">30-Day Production Throughput & Quality Trend</h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              RUNNING
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-0.5">Daily volume of inspected PCB panels vs detected defects</p>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInspections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorDefects" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-surface-200 rounded shadow-md px-3 py-2 text-xs">
                      <div className="font-mono text-surface-500 mb-1">Date: {label}</div>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 font-mono text-[11px] py-0.5">
                          <span style={{ color: entry.color }} className="font-medium">
                            {entry.name}:
                          </span>
                          <span className="font-bold text-surface-900">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              iconType="circle"
              formatter={(value) => <span className="text-surface-700 font-medium">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="inspections"
              name="Total Inspections"
              stroke="#0284c7"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorInspections)"
            />
            <Area
              type="monotone"
              dataKey="defects"
              name="Defects Localized"
              stroke="#dc2626"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#colorDefects)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
