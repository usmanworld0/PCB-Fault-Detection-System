"use client";

import React from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Layers,
  Archive,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "./Card";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  id: string | number;
  title: string;
  date: string;
  icon?: React.ReactNode;
  color?: string; // hex or tailwind text color
}

interface StationActivityTimelineProps {
  title?: string;
  amount?: number | string;
  amountSubtitle?: string;
  data: TimelineItem[];
  className?: string;
}

export function StationActivityTimeline({
  title = "Station Activity & Alerts",
  amount,
  amountSubtitle = "live station events.",
  data,
  className,
}: StationActivityTimelineProps) {
  const defaultColors = [
    "#4FD1C5", // Teal
    "#ED8936", // Orange
    "#4299E1", // Blue
    "#ECC94B", // Amber
    "#9F7AEA", // Purple
    "#319795", // Dark Teal
  ];

  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      <CardHeader className="pb-4">
        <h4 className="text-base sm:text-lg font-bold text-[#2D3748] mb-1">
          {title}
        </h4>
        <p className="text-xs text-[#A0AEC0]">
          {amount && <span className="font-bold text-[#4FD1C5] mr-1">{amount}</span>}
          {amountSubtitle}
        </p>
      </CardHeader>

      <CardBody className="pt-2">
        <div className="flex flex-col">
          {data.map((item, index) => {
            const isLast = index === data.length - 1;
            const iconColor = item.color || defaultColors[index % defaultColors.length];

            return (
              <div key={item.id} className="flex min-h-[64px] gap-3 relative">
                {/* Timeline Axis with Icon and connecting line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 bg-white border-2 shadow-2xs"
                    style={{ borderColor: iconColor, color: iconColor }}
                  >
                    {item.icon || <Bell className="w-3.5 h-3.5" />}
                  </div>
                  {!isLast && (
                    <div className="w-[2px] flex-1 bg-gray-200 mt-1 mb-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col pb-4 text-left min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-bold text-[#2D3748] leading-tight mb-1 truncate">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-medium text-[#A0AEC0]">
                    {item.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

// Backwards compatibility alias
export const OrdersOverviewTimeline = StationActivityTimeline;
