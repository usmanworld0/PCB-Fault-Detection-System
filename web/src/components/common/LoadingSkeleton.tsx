import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[10px] bg-gray-100 relative overflow-hidden after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full space-y-2.5 border border-gray-200/70 rounded-[15px] p-4 bg-white shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)]">
      <Skeleton className="h-9 w-full bg-gray-100 rounded-[8px]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-8 flex-1 bg-gray-50 rounded-[6px]" />
          ))}
        </div>
      ))}
    </div>
  );
}
