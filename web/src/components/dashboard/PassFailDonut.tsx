"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PassFailDonutProps {
  passCount: number;
  failCount: number;
  yieldRate: number;
}

export function PassFailDonut({ passCount, failCount, yieldRate }: PassFailDonutProps) {
  const data = [
    { name: "PASS", value: passCount, color: "#059669" },
    { name: "FAIL", value: failCount, color: "#dc2626" },
  ];

  const total = passCount + failCount;

  return (
    <div className="rounded-lg border border-surface-200 bg-surface-0 p-4 shadow-xs flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-surface-900 tracking-tight">Quality Disposition</h3>
          <p className="text-2xs text-surface-500 font-mono">PASS / FAIL PRODUCTION RATIO</p>
        </div>
        <span className="text-2xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-600 border border-surface-200">
          N={total}
        </span>
      </div>

      <div className="relative flex-1 min-h-[180px] mt-2 flex items-center justify-center">
        {total === 0 ? (
          <div className="text-xs text-surface-400 font-mono">No inspections recorded</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#0f172a",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-surface-900 font-mono leading-none">
                {yieldRate.toFixed(1)}%
              </span>
              <span className="text-2xs text-surface-500 font-mono uppercase tracking-wider mt-1">
                Yield Rate
              </span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-surface-100 text-xs font-mono">
        <div className="flex items-center justify-between p-1.5 rounded bg-emerald-50/50 border border-emerald-100">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            PASS
          </span>
          <span className="font-semibold text-emerald-950">{passCount}</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded bg-rose-50/50 border border-rose-100">
          <span className="flex items-center gap-1.5 text-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            FAIL
          </span>
          <span className="font-semibold text-rose-950">{failCount}</span>
        </div>
      </div>
    </div>
  );
}
