import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardBody } from "./Card";
import { cn } from "@/lib/utils";

interface EdgeVisionCardProps {
  title?: string;
  description?: string;
  backgroundImage?: string;
  linkText?: string;
  linkHref?: string;
  className?: string;
}

export function EdgeVisionCard({
  title = "Edge Station Telemetry",
  description = "High-throughput industrial optical inspection pipeline running sub-100ms inference. Captures high-resolution PCB surface boards with instant operator disposition.",
  backgroundImage = "/edge-station.webp",
  linkText = "View Inspection History",
  linkHref = "/inspections",
  className,
}: EdgeVisionCardProps) {
  return (
    <Card className={cn("min-h-[290px] p-4 overflow-hidden relative group", className)}>
      <CardBody className="p-0 h-full">
        <div className="relative w-full h-full min-h-[260px] rounded-[15px] overflow-hidden flex flex-col justify-between p-6 sm:p-7">
          {/* Background Image with subtle zoom on hover */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />

          {/* Dark gradient overlay for text contrast */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.35) 45%, rgba(15, 23, 42, 0.88) 100%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight drop-shadow-sm">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-white/90 font-normal leading-relaxed max-w-[94%] drop-shadow-xs">
              {description}
            </p>
          </div>

          <div className="relative z-10 pt-6 mt-auto">
            <Link
              href={linkHref}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-[#4FD1C5] group/link transition-colors drop-shadow-xs"
            >
              <span>{linkText}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Backwards compatibility alias
export const WorkWithTheRockets = EdgeVisionCard;
