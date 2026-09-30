"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, ScanLine, FileText } from "lucide-react";

export function AuthNavbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[1044px] px-6 py-3.5 rounded-[15px] bg-white/80 backdrop-blur-[21px] border border-white/80 shadow-[0px_7px_23px_rgba(0,0,0,0.05)] flex items-center justify-between transition-all">
      {/* Brand: PCB Vision x NCP */}
      <Link href="/dashboard" className="flex items-center gap-2.5 group">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-[10px] bg-white border border-gray-200/80 flex items-center justify-center p-1 shadow-xs">
            <img
              src="/logo.png"
              alt="PCB Vision Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xs text-gray-400 font-bold">×</span>
          <div className="w-8 h-8 rounded-[10px] bg-white border border-gray-200/80 flex items-center justify-center p-1 shadow-xs">
            <img
              src="/ncp-logo.png"
              alt="NCP Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xs tracking-wider text-[#2D3748] uppercase">
            PCB VISION × NCP
          </span>
          <span className="text-[9px] font-semibold text-[#A0AEC0] tracking-tight">
            FAULT DETECTION SYSTEM
          </span>
        </div>
      </Link>

      {/* Nav Links */}
      <div className="hidden sm:flex items-center gap-5">
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

      {/* Action CTA */}
      <Link
        href="/models"
        className="px-5 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase text-white shadow-xs hover:opacity-95 transition-all"
        style={{
          background: "linear-gradient(81.62deg, #313860 2.25%, #151928 79.87%)",
        }}
      >
        DOCUMENTATION
      </Link>
    </nav>
  );
}
