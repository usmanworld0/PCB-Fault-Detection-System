import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090D16] p-6 text-center">
      <div className="p-4 mb-4 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">404 — Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The requested inspection page, report, or resource does not exist or has been moved.
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
