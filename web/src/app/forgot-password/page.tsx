"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import {
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { requestPasswordReset } from "@/lib/api/auth";
import { AuthNavbar } from "@/components/purity/AuthNavbar";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSubmittedEmail(email.trim().toLowerCase());
    } catch (err: any) {
      setError(
        err.message ||
          "Failed to request password reset. Please check your email address and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submittedEmail) {
    return (
      <div className="space-y-5 animate-fade-in text-left py-2">
        <div className="w-12 h-12 rounded-[12px] bg-teal-50 border border-teal-200 flex items-center justify-center text-[#4FD1C5] shadow-xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#2D3748]">Check Your Email</h3>
          <p className="text-xs text-[#A0AEC0] mt-1.5 leading-relaxed">
            A password reset email has been dispatched to{" "}
            <strong className="text-[#2D3748] font-mono">{submittedEmail}</strong>.
            Click the recovery link in the email to configure a new password.
          </p>
        </div>

        <div className="p-3.5 rounded-[12px] bg-gray-50 border border-gray-200/80 text-[11px] text-[#718096] leading-normal">
          Didn't receive an email? Be sure to check your spam/junk folder, or request another link below.
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSubmittedEmail(null)}
            className="w-full py-3 rounded-[15px] bg-gray-100 hover:bg-gray-200 text-[#2D3748] text-xs font-bold transition-colors"
          >
            Try Another Email
          </button>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#A0AEC0] hover:text-[#2D3748] py-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in" autoComplete="off">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#4FD1C5] tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm font-bold text-[#A0AEC0] mt-1.5">
          Enter your email address to receive a secure recovery link
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
          Registered Email Address
        </label>
        <input
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="operator@manufacturing.org"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[15px] text-xs sm:text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:outline-none focus:border-[#4FD1C5] focus:ring-1 focus:ring-[#4FD1C5] transition-all shadow-xs"
        />
        <p className="text-[11px] text-[#A0AEC0] mt-2 ml-1 leading-normal">
          We will send a Supabase-authenticated password recovery link directly to this address.
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !email}
        className="w-full h-[45px] mt-2 flex items-center justify-center gap-2 rounded-[15px] bg-[#4FD1C5] hover:bg-[#38B2AC] text-white text-xs font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(79,209,197,0.35)] transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Sending recovery email...</span>
          </div>
        ) : (
          <>
            <span>Send Reset Instructions</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A0AEC0] hover:text-[#2D3748] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Sign In</span>
        </Link>
      </div>
    </form>
  );
}

export default function ForgotPasswordPage() {
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
              <ForgotPasswordForm />
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
              ACCOUNT SECURITY
            </h3>
            <p className="text-xs text-white/80 leading-relaxed max-w-sm">
              Secure authentication and cryptographic token verification for automated inspection stations.
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
