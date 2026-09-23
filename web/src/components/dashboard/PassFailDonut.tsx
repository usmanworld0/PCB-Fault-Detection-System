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
    { name: "PASS", value: passCount, color: "#18e299" },
    { name: "FAIL", value: failCount, color: "#f87171" },
  ];

  const total = passCount + failCount;

  return (
    <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm flex flex-col">
      <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">Quality Disposition</h3>
      <p className="text-xs text-foreground-tertiary mt-0.5">Overall pass / fail distribution</p>

      <div className="relative flex-1 min-h-[190px] mt-2 flex items-center justify-center">
        {total === 0 ? (
          <div className="text-xs text-foreground-tertiary">No inspections recorded</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--background-secondary)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background-secondary)",
                    borderColor: "var(--border-line)",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "var(--foreground-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-foreground-primary font-mono">{yieldRate.toFixed(1)}%</span>
              <span className="text-[10px] text-foreground-tertiary font-mono uppercase tracking-wider">Yield</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border-line">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-base" />
          <span className="text-xs text-foreground-tertiary font-mono">PASS:</span>
          <span className="text-xs font-mono font-medium text-foreground-primary ml-auto">{passCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-error" />
          <span className="text-xs text-foreground-tertiary font-mono">FAIL:</span>
          <span className="text-xs font-mono font-medium text-foreground-primary ml-auto">{failCount}</span>
        </div>
      </div>
    </div>
  );
}
