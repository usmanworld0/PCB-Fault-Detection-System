import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-[6px] ring-1 ring-inset ring-error/20 bg-background-secondary shadow-drop-sm">
      <div className="w-10 h-10 mb-3 rounded-full bg-error/10 text-error ring-1 ring-inset ring-error/20 flex items-center justify-center">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-foreground-tertiary max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium bg-background-tertiary hover:bg-background-tertiary-invert hover:text-foreground-invert text-foreground-primary ring-1 ring-inset ring-border-secondary transition-colors duration-150"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
