import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center font-sans">
      <div className="p-3.5 mb-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[#2D3748] mb-1.5 tracking-tight">404 — Resource Not Found</h2>
      <p className="text-xs text-[#718096] max-w-sm mb-6 leading-relaxed font-medium">
        The requested inspection page, report, or resource does not exist or has been relocated.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#4FD1C5] hover:bg-[#319795] text-white text-xs font-bold uppercase tracking-wider shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
