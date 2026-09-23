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
      className={`bg-white border border-surface-200 rounded-lg shadow-sm overflow-hidden ${
        isFullscreen ? "fixed inset-4 z-50 overflow-auto ring-2 ring-brand-500 shadow-2xl" : ""
      }`}
    >
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface-50 border-b border-surface-200 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-brand-50 text-brand-600 border border-brand-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-surface-900">AOI Optical Inspection Workstation</span>
            <span className="ml-2 font-mono text-[11px] text-surface-500">[{sourceName}]</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded bg-surface-200/70 p-0.5 border border-surface-200">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === "side-by-side"
                  ? "bg-white text-surface-900 shadow-xs font-semibold"
                  : "text-surface-600 hover:text-surface-900"
              }`}
            >
              Dual Comparison
            </button>
            <button
              onClick={() => setViewMode("annotated")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === "annotated"
                  ? "bg-white text-surface-900 shadow-xs font-semibold"
                  : "text-surface-600 hover:text-surface-900"
              }`}
            >
              Defect Overlay
            </button>
            <button
              onClick={() => setViewMode("original")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === "original"
                  ? "bg-white text-surface-900 shadow-xs font-semibold"
                  : "text-surface-600 hover:text-surface-900"
              }`}
            >
              Raw Frame
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-surface-200 rounded p-0.5 shadow-xs">
            <button
              onClick={zoomOut}
              disabled={zoomLevel <= 1}
              className="p-1 rounded text-surface-600 hover:text-surface-900 hover:bg-surface-100 disabled:opacity-30 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 text-[11px] font-mono text-surface-700 hover:text-surface-900 font-medium"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoomLevel >= 4}
              className="p-1 rounded text-surface-600 hover:text-surface-900 hover:bg-surface-100 disabled:opacity-30 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-white border border-surface-200 text-surface-600 hover:text-surface-900 hover:bg-surface-100 shadow-xs transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Canvas Area */}
      <div className="p-4 bg-surface-100/50">
        {viewMode === "side-by-side" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Original */}
            <div className="flex flex-col">
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-surface-500 mb-2 flex items-center justify-between">
                <span>1. Raw Optical Sensor Capture</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-200/80 text-surface-600">UNALTERED</span>
              </div>
              <div className="relative overflow-hidden rounded border border-surface-300 bg-surface-900 flex items-center justify-center min-h-[360px] p-2">
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
              <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-red-600 mb-2 flex items-center justify-between">
                <span>2. Automated Defect Localization</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-semibold">BOUNDING BOXES</span>
              </div>
              <div className="relative overflow-hidden rounded border border-surface-300 bg-surface-900 flex items-center justify-center min-h-[360px] p-2">
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
            <div className="w-full text-[11px] font-mono font-semibold text-red-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Automated Defect Localization Overlay</span>
              <span className="text-[10px] text-surface-500 font-normal">Showing bounding coordinates & class confidence</span>
            </div>
            <div className="w-full relative overflow-hidden rounded border border-surface-300 bg-surface-900 flex items-center justify-center min-h-[460px] p-2">
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
            <div className="w-full text-[11px] font-mono font-semibold text-surface-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Raw Optical Capture</span>
              <span className="text-[10px] text-surface-500 font-normal">Original camera resolution</span>
            </div>
            <div className="w-full relative overflow-hidden rounded border border-surface-300 bg-surface-900 flex items-center justify-center min-h-[460px] p-2">
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
