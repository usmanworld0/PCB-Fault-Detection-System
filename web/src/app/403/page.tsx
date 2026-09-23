import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-surface-50 p-6 text-center">
      <div className="p-3.5 mb-4 rounded-full bg-red-50 text-red-600 border border-red-200">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-surface-900 mb-1.5 tracking-tight">403 — Access Forbidden</h2>
      <p className="text-xs text-surface-500 max-w-sm mb-6 leading-relaxed">
        Your current role does not have authorization to view this resource. Contact an administrator if you require elevated privileges.
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
