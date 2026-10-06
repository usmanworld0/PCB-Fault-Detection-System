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
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { requestPasswordReset } from "@/lib/api/auth";
import { AuthNavbar } from "@/components/purity/AuthNavbar";
import { cn } from "@/lib/utils";

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
      <div className="space-y-5 animate-fade-in text-left py-2">
        <div className="w-12 h-12 rounded-[12px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#4FD1C5] shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#2D3748]">Check Your Inbox</h3>
          <p className="text-xs text-[#A0AEC0] mt-1 leading-relaxed">
            A password recovery link has been dispatched to{" "}
            <strong className="text-[#2D3748] font-mono">{resetSentEmail}</strong>.
            Follow the link in your email to configure a new password.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setResetSentEmail(null)}
            className="w-full py-3 rounded-[15px] bg-gray-100 hover:bg-gray-200 text-[#2D3748] text-xs font-bold transition-colors"
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
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#A0AEC0] hover:text-[#2D3748] py-1 transition-colors"
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
      <form onSubmit={handleForgotPassword} className="space-y-5 animate-fade-in" autoComplete="off">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#4FD1C5] tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs sm:text-sm font-bold text-[#A0AEC0] mt-1">
            Enter your email address to receive a secure recovery link.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[#2D3748] mb-1.5 ml-1">
            Registered Email
          </label>
          <div className="relative">
            <input
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[15px] text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#4FD1C5] focus:ring-1 focus:ring-[#4FD1C5] transition-all shadow-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full h-[45px] mt-2 flex items-center justify-center gap-2 rounded-[15px] bg-[#4FD1C5] hover:bg-[#38B2AC] text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(79,209,197,0.35)] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending link...</span>
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A0AEC0] hover:text-[#2D3748] transition-colors"
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
    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
      {/* Dual Partnership Logo (Transparent, No background boxes or borders) */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <img
          src="/logo.png"
          alt="PCB Vision Logo"
          className="w-12 h-12 object-contain"
        />
        <span className="text-lg font-bold text-[#A0AEC0]">×</span>
        <img
          src="/ncp-logo.png"
          alt="NCP Logo"
          className="w-12 h-12 object-contain"
        />
      </div>

      <div className="text-center sm:text-left">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#4FD1C5] tracking-tight">
          Welcome Back
        </h2>
        <p className="text-xs sm:text-sm font-bold text-[#A0AEC0] mt-1.5">
          PCB Vision × National Centre for Physics (NCP)
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      {/* Email or Username Field */}
      <div>
        <label className="block text-xs font-bold text-[#2D3748] mb-1.5 ml-1">
          Email or Username
        </label>
        <input
          type="text"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin or your email"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[15px] text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#4FD1C5] focus:ring-1 focus:ring-[#4FD1C5] transition-all shadow-xs"
        />
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5 ml-1">
          <label className="block text-xs font-bold text-[#2D3748]">
            Password
          </label>
          <button
            type="button"
            onClick={() => {
              setIsForgotMode(true);
              setError(null);
            }}
            className="text-xs font-bold text-[#4FD1C5] hover:text-[#319795] transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
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
      </div>


      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-[45px] mt-3 flex items-center justify-center gap-2 rounded-[15px] bg-[#4FD1C5] hover:bg-[#38B2AC] text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(79,209,197,0.35)] transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Signing in...</span>
          </div>
        ) : (
          <span>SIGN IN</span>
        )}
      </button>

      {/* Account Info */}
      <div className="text-center pt-2">
        <p className="text-xs font-medium text-[#A0AEC0]">
          Authorized manufacturing QA operator access only.
        </p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8F9FA] relative overflow-hidden font-sans">
      {/* Floating Auth Navbar */}
      <AuthNavbar />

      {/* Main Auth Content Container */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-24 pb-12 flex items-center justify-between">
        {/* Left Column: Form Card */}
        <div className="w-full md:w-[480px] lg:w-[450px] mx-auto md:mx-0 z-10">
          <div className="bg-white/80 md:bg-transparent backdrop-blur-md md:backdrop-blur-none p-6 sm:p-8 rounded-[20px] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] md:shadow-none border border-gray-100 md:border-none">
            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Right Column: Hero Cover Image Panel with PCB x NCP Branding */}
        <div className="hidden md:block w-[46vw] max-w-[620px] h-[78vh] max-h-[820px] rounded-bl-[25px] rounded-tl-[25px] overflow-hidden relative shadow-xl">
          <div
            className="w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: "url('/signInImage.png')",
              backgroundColor: "#151928",
            }}
          />
          {/* Subtle gradient overlay with PCB x NCP logos */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#151928]/95 via-[#313860]/50 to-transparent flex flex-col justify-end p-10 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-13 h-13 rounded-[12px] bg-white p-2 shadow-lg flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="PCB Vision Logo"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white/80">×</span>
              <div className="w-13 h-13 rounded-[12px] bg-white p-1.5 shadow-lg flex items-center justify-center">
                <img
                  src="/ncp-logo.png"
                  alt="NCP Logo"
                  className="w-10 h-10 object-contain"
                />
              </div>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-1">
              PCB VISION 
            </h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              National Centre for Physics & PCB Vision collaborative industrial QA vision pipeline for defect localization.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#A0AEC0] border-t border-gray-200/50 bg-[#F8F9FA] z-10">
        <p>
          © 2026 PCB Vision System × National Centre for Physics (NCP). All rights reserved.
        </p>
      </footer>
    </div>
  );
}
