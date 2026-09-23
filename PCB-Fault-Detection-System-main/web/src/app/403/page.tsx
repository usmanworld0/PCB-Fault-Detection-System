import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090D16] p-6 text-center">
      <div className="p-4 mb-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">403 — Access Forbidden</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        Your current role does not have authorization to view this resource. Contact an administrator if you require elevated privileges.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
