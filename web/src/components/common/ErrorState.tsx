import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "System Operation Error",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-2xl border border-rose-200 bg-rose-50/40 shadow-xs">
      <div className="w-11 h-11 mb-3 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-rose-950 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs sm:text-sm text-rose-700 max-w-md leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}
