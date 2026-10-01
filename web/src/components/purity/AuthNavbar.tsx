"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, ScanLine, FileText } from "lucide-react";

export function AuthNavbar() {
  return (
    <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-[92%] max-w-[1044px] px-3.5 sm:px-6 py-2.5 sm:py-3.5 rounded-[15px] bg-white/85 backdrop-blur-[21px] border border-white/90 shadow-[0px_7px_23px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all">
      {/* Brand: PCB Vision x NCP (Clean & Transparent) */}
      <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 group min-w-0 shrink">
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src="/logo.png"
            alt="PCB Vision Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
          />
          <span className="text-[11px] sm:text-xs text-gray-400 font-bold">×</span>
          <img
            src="/ncp-logo.png"
            alt="NCP Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-[11px] sm:text-xs tracking-wider text-[#2D3748] uppercase whitespace-nowrap truncate">
            PCB VISION × NCP
          </span>
          <span className="text-[8px] sm:text-[9px] font-semibold text-[#A0AEC0] tracking-tight whitespace-nowrap truncate hidden xs:block">
            FAULT DETECTION SYSTEM
          </span>
        </div>
      </Link>

      {/* Nav Links (Hidden on small mobile screens, visible on md+) */}
      <div className="hidden md:flex items-center gap-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#2D3748] transition-colors"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-[#4FD1C5]" />
          <span>DASHBOARD</span>
        </Link>
        <Link
          href="/inspections"
          className="flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#2D3748] transition-colors"
        >
          <ScanLine className="w-3.5 h-3.5 text-[#4FD1C5]" />
          <span>INSPECTIONS</span>
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-xs font-bold text-[#718096] hover:text-[#2D3748] transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-[#4FD1C5]" />
          <span>SIGN IN</span>
        </Link>
      </div>

      {/* Action CTA: Responsive Documentation Button */}
      <Link
        href="/models"
        className="shrink-0 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-white shadow-xs hover:opacity-95 transition-all"
        style={{
          background: "linear-gradient(81.62deg, #313860 2.25%, #151928 79.87%)",
        }}
      >
        <span className="hidden sm:inline">DOCUMENTATION</span>
        <span className="sm:hidden">DOCS</span>
      </Link>
    </nav>
  );
}
