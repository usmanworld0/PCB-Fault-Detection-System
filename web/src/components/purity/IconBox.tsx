import React from "react";
import { cn } from "@/lib/utils";

interface IconBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function IconBox({
  children,
  className,
  size = "md",
  ...props
}: IconBoxProps) {
  const sizeClasses = {
    sm: "w-[30px] h-[30px] rounded-[10px]",
    md: "w-[45px] h-[45px] rounded-[12px]",
    lg: "w-[54px] h-[54px] rounded-[15px]",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 transition-transform select-none",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
