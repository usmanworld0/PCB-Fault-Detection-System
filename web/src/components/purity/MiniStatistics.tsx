import React from "react";
import { Card, CardBody } from "./Card";
import { IconBox } from "./IconBox";
import { cn } from "@/lib/utils";

interface MiniStatisticsProps {
  title: string;
  amount: string | number;
  percentage?: number;
  percentageText?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export function MiniStatistics({
  title,
  amount,
  percentage,
  percentageText,
  icon,
  iconBg = "bg-[#4FD1C5]",
  iconColor = "text-white",
  className,
}: MiniStatisticsProps) {
  const isPositive = percentage !== undefined ? percentage >= 0 : true;
  const displayPercentage =
    percentageText ??
    (percentage !== undefined
      ? `${isPositive ? "+" : ""}${percentage}%`
      : undefined);

  return (
    <Card className={cn("min-h-[84px] py-4 px-5 justify-center", className)}>
      <CardBody>
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col flex-1 min-w-0 pr-3">
            <span className="text-[12px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-0.5 truncate">
              {title}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-[#2D3748] tracking-tight">
                {amount}
              </span>
              {displayPercentage && (
                <span
                  className={cn(
                    "text-xs sm:text-sm font-bold",
                    isPositive ? "text-[#48BB78]" : "text-[#E53E3E]"
                  )}
                >
                  {displayPercentage}
                </span>
              )}
            </div>
          </div>
          <IconBox
            size="md"
            className={cn(
              iconBg,
              iconColor,
              "shadow-[0_2px_8px_rgba(79,209,197,0.3)] shrink-0"
            )}
          >
            {icon}
          </IconBox>
        </div>
      </CardBody>
    </Card>
  );
}
