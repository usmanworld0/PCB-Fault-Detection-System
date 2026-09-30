import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center font-sans">
      <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[#2D3748] mb-1.5 tracking-tight">403 — Access Forbidden</h2>
      <p className="text-xs text-[#718096] max-w-sm mb-6 leading-relaxed font-medium">
        Your current role does not have authorization to view this resource. Contact an administrator if you require elevated privileges.
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
