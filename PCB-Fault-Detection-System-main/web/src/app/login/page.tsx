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
        <div className="flex items-start gap-2.5 p-3 rounded-[4px] bg-error/10 ring-1 ring-inset ring-error/20 text-error text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-mono font-medium text-foreground-secondary mb-1.5 uppercase tracking-wider">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-muted">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full pl-9 pr-3 py-2 bg-background-primary ring-1 ring-inset ring-border-secondary rounded-[4px] text-xs text-foreground-primary placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-base transition-shadow duration-150 font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-mono font-medium text-foreground-secondary mb-1.5 uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-muted">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2 bg-background-primary ring-1 ring-inset ring-border-secondary rounded-[4px] text-xs text-foreground-primary placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-base transition-shadow duration-150 font-mono"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] bg-brand-base hover:bg-brand-vivid active:opacity-90 text-base-black text-xs font-semibold shadow-button-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-base-black border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background-primary p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[6px] bg-brand-10 text-brand-base ring-1 ring-inset ring-brand-20 mb-3 shadow-drop-sm">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-medium tracking-tight text-foreground-primary flex items-center justify-center gap-2">
            PCB-Vision
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-brand-10 text-brand-base ring-1 ring-inset ring-brand-20">
              QC Platform
            </span>
          </h1>
          <p className="text-xs text-foreground-tertiary mt-1">
            Automated Quality Control & Defect Detection System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-[6px] ring-1 ring-inset ring-border-secondary bg-background-secondary p-8 shadow-feature-card">
          <Suspense fallback={<div className="h-48 flex items-center justify-center text-xs text-foreground-tertiary">Loading sign in...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-5 border-t border-border-line text-center">
            <p className="text-[11px] text-foreground-tertiary leading-relaxed">
              Access is restricted to authorized inspection engineers and quality managers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[11px] text-foreground-muted font-mono">
          PCB-Vision Platform · Industrial Quality Assurance
        </div>
      </div>
    </div>
  );
}
