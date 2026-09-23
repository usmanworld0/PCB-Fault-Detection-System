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
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-rose-200 bg-rose-50/50 shadow-xs">
      <div className="w-9 h-9 mb-2 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-rose-950 tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-rose-700 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-surface-0 hover:bg-surface-50 text-surface-800 border border-surface-300 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Operation
        </button>
      )}
    </div>
  );
}
