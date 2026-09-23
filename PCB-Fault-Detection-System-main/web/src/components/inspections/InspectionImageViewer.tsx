"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, Layers } from "lucide-react";

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
      className={`rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-5 shadow-drop-sm ${
        isFullscreen ? "fixed inset-4 z-50 overflow-auto bg-background-secondary ring-brand-20" : ""
      }`}
    >
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-border-line text-xs">
        <div className="flex items-center gap-2 font-medium text-foreground-primary">
          <div className="p-1 rounded-[4px] bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight">PCB Dual Inspection Viewer</span>
          <span className="text-foreground-tertiary font-mono text-[11px]">({sourceName})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-[4px] bg-background-primary ring-1 ring-inset ring-border-secondary p-0.5">
            <button
              onClick={() => setViewMode("side-by-side")}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-medium transition-colors duration-150 ${
                viewMode === "side-by-side"
                  ? "bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20 font-medium"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode("annotated")}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-medium transition-colors duration-150 ${
                viewMode === "annotated"
                  ? "bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20 font-medium"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              AI Annotated
            </button>
            <button
              onClick={() => setViewMode("original")}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-medium transition-colors duration-150 ${
                viewMode === "original"
                  ? "bg-brand-8 text-brand-base ring-1 ring-inset ring-brand-20 font-medium"
                  : "text-foreground-secondary hover:text-foreground-primary"
              }`}
            >
              Raw Frame
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-background-primary ring-1 ring-inset ring-border-secondary rounded-[4px] p-0.5">
            <button
              onClick={zoomOut}
              disabled={zoomLevel <= 1}
              className="p-1 rounded-[2px] text-foreground-secondary hover:text-foreground-primary disabled:opacity-30 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-1.5 text-[11px] font-mono text-foreground-secondary hover:text-foreground-primary"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoomLevel >= 4}
              className="p-1 rounded-[2px] text-foreground-secondary hover:text-foreground-primary disabled:opacity-30 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-[4px] bg-background-primary ring-1 ring-inset ring-border-secondary text-foreground-secondary hover:text-foreground-primary transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Image Display Area */}
      <div className="overflow-auto max-h-[600px] rounded-[6px] bg-background-primary/40 ring-1 ring-inset ring-border-secondary p-3">
        {viewMode === "side-by-side" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Original */}
            <div className="flex flex-col">
              <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-foreground-tertiary mb-2 flex items-center justify-between">
                <span>Original PCB Image</span>
                <span className="text-[10px] text-foreground-muted">Raw Input</span>
              </div>
              <div className="relative overflow-hidden rounded-[4px] ring-1 ring-inset ring-border-secondary bg-background-primary flex items-center justify-center min-h-[300px]">
                <img
                  src={imageUrl}
                  alt="Raw PCB"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
                  className="transition-transform duration-200 object-contain max-h-[480px] w-auto"
                />
              </div>
            </div>

            {/* AI Annotated */}
            <div className="flex flex-col">
              <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-error mb-2 flex items-center justify-between">
                <span>AI Defect Localization</span>
                <span className="text-[10px] text-error/80">Bounding Boxes & Labels</span>
              </div>
              <div className="relative overflow-hidden rounded-[4px] ring-1 ring-inset ring-error/20 bg-background-primary flex items-center justify-center min-h-[300px]">
                <img
                  src={annotatedUrl}
                  alt="Annotated PCB"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
                  className="transition-transform duration-200 object-contain max-h-[480px] w-auto"
                />
              </div>
            </div>
          </div>
        ) : viewMode === "annotated" ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-full text-[11px] font-mono font-medium text-error uppercase tracking-wider mb-2">
              AI Defect Localization
            </div>
            <img
              src={annotatedUrl}
              alt="Annotated PCB"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
              className="transition-transform duration-200 object-contain max-h-[550px] w-auto rounded-[4px] ring-1 ring-inset ring-error/20"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-full text-[11px] font-mono font-medium text-foreground-tertiary uppercase tracking-wider mb-2">
              Original PCB Frame
            </div>
            <img
              src={imageUrl}
              alt="Raw PCB"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
              className="transition-transform duration-200 object-contain max-h-[550px] w-auto rounded-[4px] ring-1 ring-inset ring-border-secondary"
            />
          </div>
        )}
      </div>
    </div>
  );
}
