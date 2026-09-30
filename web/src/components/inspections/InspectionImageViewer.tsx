"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Layers, Eye, Sliders } from "lucide-react";

interface InspectionImageViewerProps {
  imageUrl: string;
  annotatedUrl: string;
  sourceName: string;
}

export function InspectionImageViewer({
  imageUrl,
  annotatedUrl,
  sourceName,
}: InspectionImageViewerProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "annotated" | "original">("side-by-side");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1));
  const resetZoom = () => setZoomLevel(1);

  return (
    <div
      className={`bg-white border border-gray-200/70 rounded-[15px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] overflow-hidden font-sans ${
        isFullscreen ? "fixed inset-4 z-50 overflow-auto ring-2 ring-[#4FD1C5] shadow-2xl" : ""
      }`}
    >
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-white border-b border-gray-100 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-[#4FD1C5] text-white flex items-center justify-center shadow-[0_2px_4px_rgba(79,209,197,0.25)]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#2D3748]">AOI Optical Inspection Workstation</span>
            <span className="ml-2 text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider">[{sourceName}]</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-[8px] bg-gray-100 p-0.5 border border-gray-200/60">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-3 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-colors ${
                viewMode === "side-by-side"
                  ? "bg-white text-[#2D3748] shadow-xs"
                  : "text-[#A0AEC0] hover:text-[#2D3748]"
              }`}
            >
              Dual Comparison
            </button>
            <button
              onClick={() => setViewMode("annotated")}
              className={`px-3 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-colors ${
                viewMode === "annotated"
                  ? "bg-white text-[#2D3748] shadow-xs"
                  : "text-[#A0AEC0] hover:text-[#2D3748]"
              }`}
            >
              Defect Overlay
            </button>
            <button
              onClick={() => setViewMode("original")}
              className={`px-3 py-1 rounded-[6px] text-[10px] font-bold uppercase tracking-wider transition-colors ${
                viewMode === "original"
                  ? "bg-white text-[#2D3748] shadow-xs"
                  : "text-[#A0AEC0] hover:text-[#2D3748]"
              }`}
            >
              Raw Frame
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-gray-200/70 rounded-[8px] p-0.5 shadow-xs">
            <button
              onClick={zoomOut}
              disabled={zoomLevel <= 1}
              className="p-1 rounded text-[#718096] hover:text-[#2D3748] hover:bg-gray-100 disabled:opacity-30 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 text-[11px] font-bold text-[#2D3748] hover:text-teal-600"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoomLevel >= 4}
              className="p-1 rounded text-[#718096] hover:text-[#2D3748] hover:bg-gray-100 disabled:opacity-30 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-[8px] bg-white border border-gray-200/70 text-[#718096] hover:text-[#2D3748] hover:bg-gray-100 shadow-xs transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Canvas Area */}
      <div className="p-4 bg-[#F8F9FA]">
        {viewMode === "side-by-side" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Original */}
            <div className="flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0] mb-2 flex items-center justify-between">
                <span>1. Raw Optical Sensor Capture</span>
                <span className="text-[9px] px-2 py-0.5 rounded-[6px] bg-gray-200/80 text-[#718096] font-bold">UNALTERED</span>
              </div>
              <div className="relative overflow-hidden rounded-[12px] border border-gray-300 bg-[#1A202C] flex items-center justify-center min-h-[360px] p-2">
                <img
                  src={imageUrl}
                  alt="Raw PCB Frame"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
                  className="transition-transform duration-200 object-contain max-h-[500px] w-auto"
                />
              </div>
            </div>

            {/* AI Annotated */}
            <div className="flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-2 flex items-center justify-between">
                <span>2. Automated Defect Localization</span>
                <span className="text-[9px] px-2 py-0.5 rounded-[6px] bg-red-50 text-rose-600 border border-red-200 font-bold">BOUNDING BOXES</span>
              </div>
              <div className="relative overflow-hidden rounded-[12px] border border-gray-300 bg-[#1A202C] flex items-center justify-center min-h-[360px] p-2">
                <img
                  src={annotatedUrl}
                  alt="Annotated PCB Frame"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
                  className="transition-transform duration-200 object-contain max-h-[500px] w-auto"
                />
              </div>
            </div>
          </div>
        ) : viewMode === "annotated" ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-full text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Automated Defect Localization Overlay</span>
              <span className="text-[10px] text-[#A0AEC0] font-bold">Showing bounding coordinates & class confidence</span>
            </div>
            <div className="w-full relative overflow-hidden rounded-[12px] border border-gray-300 bg-[#1A202C] flex items-center justify-center min-h-[460px] p-2">
              <img
                src={annotatedUrl}
                alt="Annotated PCB"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
                className="transition-transform duration-200 object-contain max-h-[580px] w-auto"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-full text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Raw Optical Capture</span>
              <span className="text-[10px] text-[#A0AEC0] font-bold">Original camera resolution</span>
            </div>
            <div className="w-full relative overflow-hidden rounded-[12px] border border-gray-300 bg-[#1A202C] flex items-center justify-center min-h-[460px] p-2">
              <img
                src={imageUrl}
                alt="Raw PCB"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
                className="transition-transform duration-200 object-contain max-h-[580px] w-auto"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
