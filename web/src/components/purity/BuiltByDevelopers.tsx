import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardBody } from "./Card";
import { cn } from "@/lib/utils";

interface EngineOverviewCardProps {
  title?: string;
  name?: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
  className?: string;
}

export function EngineOverviewCard({
  title = "Deep Learning Core",
  name = "PCB Vision AI Engine",
  description = "Real-time automated optical inspection (AOI) localized with YOLOv8 and Faster R-CNN neural architectures. Classifies surface flaws, open circuits, and component misalignments.",
  linkText = "Explore Model Registry",
  linkHref = "/models",
  className,
}: EngineOverviewCardProps) {
  return (
    <Card className={cn("min-h-[290px] p-5 sm:p-6", className)}>
      <CardBody>
        <div className="flex flex-col lg:flex-row justify-between h-full gap-5">
          {/* Left Text Column */}
          <div className="flex flex-col justify-between h-full w-full lg:w-[54%]">
            <div>
              <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-wider mb-1">
                {title}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-[#2D3748] mb-2 leading-snug">
                {name}
              </h3>
              <p className="text-sm text-[#A0AEC0] font-normal leading-relaxed line-clamp-4">
                {description}
              </p>
            </div>

            <div className="pt-4 mt-auto">
              <Link
                href={linkHref}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#2D3748] hover:text-[#4FD1C5] group transition-colors"
              >
                <span>{linkText}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Visual Column (Transparent PCB Fault Detection Core Logo) */}
          <div className="w-full lg:w-[42%] min-h-[210px] lg:min-h-full flex items-center justify-center p-4 relative group">
            <img
              src="/pcb-fault-logo.png"
              alt="PCB Fault Detection Core"
              className="w-full h-full max-h-[240px] object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Backwards compatibility alias
export const BuiltByDevelopers = EngineOverviewCard;
