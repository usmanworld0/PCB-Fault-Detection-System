import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-surface-50 p-6 text-center">
      <div className="p-3.5 mb-4 rounded-full bg-surface-100 text-surface-600 border border-surface-200">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-surface-900 mb-1.5 tracking-tight">404 — Resource Not Found</h2>
      <p className="text-xs text-surface-500 max-w-sm mb-6 leading-relaxed">
        The requested inspection page, report, or resource does not exist or has been relocated.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
