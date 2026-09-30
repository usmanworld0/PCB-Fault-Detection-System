"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardBody } from "./Card";
import { cn } from "@/lib/utils";

interface InspectionTrendChartProps {
  title?: string;
  subtitle?: string;
  percentage?: number;
  year?: string | number;
  data?: {
    name: string;
    primary: number;
    secondary?: number;
  }[];
  primaryName?: string;
  secondaryName?: string;
  className?: string;
}

const defaultData = [
  { name: "01", primary: 50, secondary: 52 },
  { name: "05", primary: 40, secondary: 45 },
  { name: "10", primary: 300, secondary: 310 },
  { name: "15", primary: 220, secondary: 235 },
  { name: "20", primary: 500, secondary: 512 },
  { name: "25", primary: 250, secondary: 260 },
  { name: "30", primary: 400, secondary: 408 },
];

export function InspectionTrendChart({
  title = "30-Day Inspection Telemetry",
  subtitle,
  percentage,
  year = 2026,
  data = defaultData,
  primaryName = "Passed Boards",
  secondaryName = "Total Inspected",
  className,
}: InspectionTrendChartProps) {
  const isPositive = percentage !== undefined ? percentage >= 0 : true;

  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <CardHeader className="mb-4">
        <div className="flex flex-col text-left">
          <h4 className="text-base sm:text-lg font-bold text-[#2D3748] mb-1">
            {title}
          </h4>
          <p className="text-xs sm:text-sm font-medium text-[#A0AEC0]">
            {percentage !== undefined ? (
              <>
                <span
                  className={cn(
                    "font-bold mr-1",
                    isPositive ? "text-[#48BB78]" : "text-[#E53E3E]"
                  )}
                >
                  {isPositive ? `+${percentage}%` : `${percentage}%`} more
                </span>
                in {year}
              </>
            ) : (
              subtitle || "Daily board inspection throughput & pass rate"
            )}
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="w-full h-[280px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="purityTealGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4FD1C5" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4FD1C5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="puritySlateGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2D3748" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#2D3748" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="5 5"
                stroke="#E2E8F0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#A0AEC0", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fill: "#A0AEC0", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#E2E8F0",
                  borderRadius: "12px",
                  color: "#2D3748",
                  fontSize: "12px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
                }}
              />
              {/* Primary Curve (Passed Boards in Teal #4FD1C5) */}
              <Area
                type="monotone"
                dataKey="primary"
                name={primaryName}
                stroke="#4FD1C5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#purityTealGradient)"
              />
              {/* Secondary Curve (Total Inspected in Dark Slate #2D3748) */}
              {data.some((d) => d.secondary !== undefined) && (
                <Area
                  type="monotone"
                  dataKey="secondary"
                  name={secondaryName}
                  stroke="#2D3748"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#puritySlateGradient)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

// Backwards compatibility alias
export const SalesOverviewChart = InspectionTrendChart;
