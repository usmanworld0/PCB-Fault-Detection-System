"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const expired = searchParams.get("expired");

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(expired ? "Session expired. Please sign in again." : null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-mono font-semibold text-surface-600 mb-1.5 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@pcb-vision.internal"
            className="w-full pl-9 pr-3 py-2 bg-white border border-surface-200 rounded text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono shadow-xs"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono font-semibold text-surface-600 mb-1.5 uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2 bg-white border border-surface-200 rounded text-xs text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono shadow-xs"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Authenticate Station</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-50 p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-brand-600 text-white shadow-xs mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-surface-900 flex items-center justify-center gap-2">
            PCB-VISION
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
              INDUSTRIAL QA
            </span>
          </h1>
          <p className="text-xs text-surface-500 mt-1">
            Quality Control & Defect Detection System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-surface-200 rounded-lg p-6 shadow-sm">
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-xs text-surface-400">Loading sign in...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-5 pt-4 border-t border-surface-100 text-center">
            <p className="text-[11px] text-surface-400 leading-relaxed font-mono">
              Access restricted to certified inspection engineers and QA management.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[11px] text-surface-400 font-mono">
          PCB-Vision Platform · Industrial Quality Assurance
        </div>
      </div>
    </div>
  );
}
