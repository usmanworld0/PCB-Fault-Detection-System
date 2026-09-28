"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { requestPasswordReset } from "@/lib/api/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const expired = searchParams.get("expired");

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    expired ? "Session expired. Please sign in again." : null
  );
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password mode state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setResetSentEmail(email.trim().toLowerCase());
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to request password reset. Please check the email address and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --- View: Password Reset Success State ---
  if (isForgotMode && resetSentEmail) {
    return (
      <div className="space-y-4 animate-fade-in text-center py-2">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-surface-900">Check Your Inbox</h3>
          <p className="text-xs text-surface-500 leading-relaxed">
            A password recovery link has been sent to{" "}
            <span className="font-mono font-semibold text-surface-800">{resetSentEmail}</span>.
            Follow the link in your email to set a new password.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setResetSentEmail(null);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-surface-100 hover:bg-surface-200 text-surface-700 text-xs font-semibold border border-surface-200 transition-colors"
          >
            Send Another Link
          </button>
          <button
            type="button"
            onClick={() => {
              setIsForgotMode(false);
              setResetSentEmail(null);
              setError(null);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-surface-500 hover:text-surface-900 py-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  // --- View: Forgot Password Form ---
  if (isForgotMode) {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
        <div className="mb-2">
          <h2 className="text-xl font-bold tracking-tight text-surface-900">
            Reset Password
          </h2>
          <p className="text-xs text-surface-500 mt-1">
            Enter your email address to receive a secure Supabase password recovery link.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-surface-700 mb-1.5">
            Registered Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono shadow-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-[0.99]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending recovery link...</span>
            </div>
          ) : (
            <>
              <span>Send Recovery Link</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsForgotMode(false);
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </form>
    );
  }

  // --- View: Standard Login Form ---
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight text-surface-900">
          Sign In
        </h2>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1.5">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono shadow-xs"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-surface-700">
            Password
          </label>
          <button
            type="button"
            onClick={() => {
              setIsForgotMode(true);
              setError(null);
            }}
            className="text-xs font-medium text-industrial-600 hover:text-industrial-900 transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono shadow-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-[0.99]"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Signing in...</span>
          </div>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-surface-50">
      {/* Left Feature Panel: Cover Image (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden text-white p-12 flex-col items-center justify-center">
        <img
          src="/auth-cover.png"
          alt="PCB Inspection Cover"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/80" />

        {/* Centered Logo Only */}
        <div className="relative z-10 flex items-center justify-center animate-fade-in">
          <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center drop-shadow-2xl">
            <img src="/logo.png" alt="PCB Vision Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Brand Banner */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-900 border border-surface-700 p-2 shadow-md mb-3">
              <img src="/logo.png" alt="PCB Vision Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-surface-900">
              PCB-VISION
            </h1>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-surface-200 rounded-2xl p-6 sm:p-8 shadow-sm sm:shadow-md">
            <Suspense
              fallback={
                <div className="h-44 flex flex-col items-center justify-center gap-2 text-xs text-surface-400">
                  <div className="w-5 h-5 border-2 border-industrial-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
