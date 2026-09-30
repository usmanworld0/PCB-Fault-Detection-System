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
import { AuthNavbar } from "@/components/purity/AuthNavbar";

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
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#4FD1C5]/30 border-t-[#4FD1C5] rounded-full animate-spin" />
        <span className="text-xs font-bold text-[#A0AEC0] mt-3">
          Verifying security session...
        </span>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5 animate-fade-in text-left py-2">
        <div className="w-12 h-12 rounded-[12px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#4FD1C5] shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#2D3748]">Password Reset Complete</h3>
          <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed">
            Your account password has been updated successfully via Supabase Authentication. You may now sign in with your new password.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="w-full h-[45px] inline-flex items-center justify-center gap-2 rounded-[15px] bg-[#4FD1C5] hover:bg-[#38B2AC] text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(79,209,197,0.35)] transition-all"
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
      <div className="space-y-4 animate-fade-in text-left py-2">
        <div className="w-12 h-12 rounded-[12px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#2D3748]">Session or Link Expired</h3>
          <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed">
            This password reset link is invalid or has expired. Supabase password reset links can only be used once.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="w-full h-[45px] inline-flex items-center justify-center gap-2 rounded-[15px] bg-[#4FD1C5] hover:bg-[#38B2AC] text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(79,209,197,0.35)] transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Request New Reset Link</span>
          </Link>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center text-xs font-bold text-[#A0AEC0] hover:text-[#2D3748] py-1 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#4FD1C5] tracking-tight">
          New Password
        </h2>
        <p className="text-xs sm:text-sm font-bold text-[#A0AEC0] mt-1.5">
          Configure a new strong password for your operator account
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* New Password Field */}
      <div>
        <label className="block text-xs font-bold text-[#2D3748] mb-1.5 ml-1">
          New Strong Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-4 pr-10 py-3 bg-white border border-gray-200 rounded-[15px] text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#4FD1C5] focus:ring-1 focus:ring-[#4FD1C5] transition-all shadow-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Real-time Password Strength Meter */}
        <div className="mt-2.5">
          <PasswordStrengthMeter password={password} />
        </div>
      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-xs font-bold text-[#2D3748] mb-1.5 ml-1">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 pr-10 py-3 bg-white border border-gray-200 rounded-[15px] text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#4FD1C5] focus:ring-1 focus:ring-[#4FD1C5] transition-all shadow-xs"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="text-[11px] text-rose-600 font-bold mt-1.5 ml-1">
            Passwords do not match
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          isLoading ||
          !checkPasswordStrength(password).isValid ||
          password !== confirmPassword
        }
        className="w-full h-[45px] mt-2 flex items-center justify-center gap-2 rounded-[15px] bg-[#4FD1C5] hover:bg-[#38B2AC] text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(79,209,197,0.35)] transition-all disabled:opacity-40"
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A0AEC0] hover:text-[#2D3748] transition-colors"
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8F9FA] relative overflow-hidden font-sans">
      {/* Floating Auth Navbar */}
      <AuthNavbar />

      {/* Main Auth Content Container */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 pb-12 flex items-center justify-between">
        {/* Left Column: Form Card */}
        <div className="w-full md:w-[480px] lg:w-[450px] mx-auto md:mx-0 z-10">
          <div className="bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-6 sm:p-8 rounded-[20px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] md:shadow-none border border-gray-100 md:border-none">
            {/* Dual Partnership Logo Badge */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-[12px] bg-white border border-gray-200/90 p-1.5 shadow-sm flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="PCB Vision Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base font-bold text-[#A0AEC0]">×</span>
              <div className="w-11 h-11 rounded-[12px] bg-white border border-gray-200/90 p-1.5 shadow-sm flex items-center justify-center">
                <img
                  src="/ncp-logo.png"
                  alt="NCP Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <Suspense fallback={<div className="h-64" />}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>

        {/* Right Column: Hero Cover Image Panel */}
        <div className="hidden md:block w-[46vw] max-w-[620px] h-[78vh] max-h-[820px] rounded-bl-[25px] rounded-tl-[25px] overflow-hidden relative shadow-xl">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('/signInImage.png')",
              backgroundColor: "#151928",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151928]/95 via-[#313860]/50 to-transparent flex flex-col justify-end p-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-[12px] bg-white p-2 shadow-lg flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="PCB Vision Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-lg font-bold text-white/80">×</span>
              <div className="w-12 h-12 rounded-[12px] bg-white p-1.5 shadow-lg flex items-center justify-center">
                <img
                  src="/ncp-logo.png"
                  alt="NCP Logo"
                  className="w-9 h-9 object-contain"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-1">
              ENTERPRISE SECURITY
            </h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Cryptographically verified sessions and role-governed authorization parameters.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#A0AEC0] border-t border-gray-200/50 bg-[#F8F9FA] z-10">
        <p>
          © 2026 PCB Vision System. Automated Optical Inspection & Defect Telemetry.
        </p>
      </footer>
    </div>
  );
}
