"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { checkPasswordStrength } from "@/lib/utils/password";
import { PasswordStrengthMeter } from "@/components/common/PasswordStrengthMeter";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabase();

    // 1. Listen for Supabase Auth PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasValidSession(true);
        setIsVerifying(false);
      }
    });

    // 2. Check current session / URL hash recovery token
    const verifySession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session && !sessionError) {
          setHasValidSession(true);
        } else {
          // If URL has access_token or recovery type in hash
          if (
            typeof window !== "undefined" &&
            (window.location.hash.includes("type=recovery") ||
              window.location.hash.includes("access_token=") ||
              window.location.search.includes("code="))
          ) {
            setHasValidSession(true);
          } else {
            setHasValidSession(false);
          }
        }
      } catch (err) {
        if (isMounted) setHasValidSession(false);
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    verifySession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Verify passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both fields are identical.");
      return;
    }

    // 2. Strong password check
    const strength = checkPasswordStrength(password);
    if (!strength.isValid) {
      setError(
        strength.errorMessage ||
          "Password does not fulfill all strong password security requirements."
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabase();
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw new Error(updateError.message || "Failed to update password in Supabase Auth.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while resetting your password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return <div className="py-12" />;
  }

  if (success) {
    return (
      <div className="space-y-5 animate-fade-in text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-surface-900">Password Reset Complete</h3>
          <p className="text-xs text-surface-500 leading-relaxed max-w-xs mx-auto">
            Your account password has been successfully updated via Supabase Authentication. You may now sign in with your new password.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="space-y-4 animate-fade-in text-center py-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-surface-900">Session or Link Expired</h3>
          <p className="text-xs text-surface-500 leading-relaxed">
            This password reset link is invalid or has expired. Supabase password reset links can only be used once.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/forgot-password"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Request New Reset Link</span>
          </Link>
          <Link
            href="/login"
            className="text-xs text-surface-500 hover:text-surface-800 py-1 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      {error && (
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* New Password Field */}
      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1.5">
          New Strong Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
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

        {/* Real-time Password Strength Meter */}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-xs font-semibold text-surface-700 mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 transition-all font-mono shadow-xs"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-surface-400 hover:text-surface-600 transition-colors"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-[11px] text-rose-600 font-mono mt-1">Passwords do not match</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !checkPasswordStrength(password).isValid || password !== confirmPassword}
        className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-40 active:scale-[0.99]"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Updating password...</span>
          </div>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Save New Password</span>
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-surface-500 hover:text-surface-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
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

        <div className="relative z-10 flex items-center justify-center animate-fade-in">
          <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center drop-shadow-2xl">
            <img src="/logo.png" alt="PCB Vision Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Right Column: Reset Password Container */}
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
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-surface-900">
                Create New Password
              </h2>
              <p className="text-xs text-surface-500 mt-1">
                Enter your new password below. It will be verified against enterprise security rules.
              </p>
            </div>

            <Suspense fallback={<div className="h-44" />}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
