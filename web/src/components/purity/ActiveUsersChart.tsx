"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Layers, AlertTriangle, Cpu, ShieldAlert } from "lucide-react";
import { Card, CardBody } from "./Card";
import { IconBox } from "./IconBox";
import { cn } from "@/lib/utils";

export interface ChartStatItem {
  title: string;
  amount: string | number;
  percentage: number;
  icon: React.ReactNode;
}

interface DefectDistributionChartProps {
  title?: string;
  subtitle?: string;
  percentage?: number;
  percentageSubtitle?: string;
  data?: { name: string; value: number }[];
  stats?: ChartStatItem[];
  className?: string;
}

const defaultData = [
  { name: "Missing Hole", value: 330 },
  { name: "Mouse Bite", value: 250 },
  { name: "Open Circuit", value: 110 },
  { name: "Short", value: 300 },
  { name: "Spur", value: 190 },
  { name: "Spurious Cu", value: 140 },
];

export function DefectDistributionChart({
  title = "Defect Class Distribution",
  subtitle,
  percentage,
  percentageSubtitle = "than last week",
  data = defaultData,
  stats,
  className,
}: DefectDistributionChartProps) {
  const defaultStats: ChartStatItem[] = [
    {
      title: "Missing Hole",
      amount: "32",
      percentage: 60,
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      title: "Mouse Bite",
      amount: "18",
      percentage: 45,
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
    {
      title: "Open Circuit",
      amount: "12",
      percentage: 30,
      icon: <Cpu className="w-3.5 h-3.5" />,
    },
    {
      title: "Short Circuit",
      amount: "8",
      percentage: 20,
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
    },
  ];

  const items = stats || defaultStats;
  const isPositive = percentage !== undefined ? percentage >= 0 : true;

  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <CardBody>
        <div className="flex flex-col w-full">
          {/* Top Dark Bar Chart Box */}
          <div
            className="w-full h-[220px] rounded-[15px] p-3 sm:p-4 flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(81.62deg, #313860 2.25%, #151928 79.87%)",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  hide
                />
                <YAxis
                  tick={{ fill: "#FFFFFF", fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  contentStyle={{
                    backgroundColor: "#1f2733",
                    borderColor: "transparent",
                    borderRadius: "10px",
                    color: "#FFFFFF",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  itemStyle={{ color: "#4FD1C5" }}
                />
                <Bar
                  dataKey="value"
                  fill="#FFFFFF"
                  radius={[5, 5, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Title & Anomaly frequency */}
          <div className="flex flex-col mt-5 mb-6 text-left">
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
                    {isPositive ? `+${percentage}%` : `${percentage}%`}
                  </span>
                  {percentageSubtitle}
                </>
              ) : (
                subtitle || "Classified anomaly frequency across active production runs"
              )}
            </p>
          </div>

          {/* 4 Bottom Mini Metrics with Progress Bars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-1">
                  <IconBox
                    size="sm"
                    className="bg-[#4FD1C5] text-white shadow-xs"
                  >
                    {item.icon}
                  </IconBox>
                  <span className="text-xs font-semibold text-[#A0AEC0] truncate">
                    {item.title}
                  </span>
                </div>
                <span className="text-base sm:text-lg font-bold text-[#2D3748] my-1">
                  {item.amount}
                </span>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#4FD1C5] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(Math.max(item.percentage, 5), 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Backwards compatibility alias
export const ActiveUsersChart = DefectDistributionChart;
