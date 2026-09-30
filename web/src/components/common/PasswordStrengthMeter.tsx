"use client";

import React from "react";
import { Check, X, ShieldAlert, ShieldCheck } from "lucide-react";
import { checkPasswordStrength } from "@/lib/utils/password";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  showRequirements = true,
  className = "",
}: PasswordStrengthMeterProps) {
  if (!password) {
    return null;
  }

  const result = checkPasswordStrength(password);

  return (
    <div className={`space-y-2 mt-2 pt-1 animate-fade-in ${className}`}>
      {/* Progress Bar & Status */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] font-sans">
          <span className="text-[#718096] font-semibold">Password Strength:</span>
          <span
            className={`font-bold uppercase tracking-wider ${
              result.level === "Strong"
                ? "text-emerald-600"
                : result.level === "Good"
                ? "text-teal-600"
                : result.level === "Fair"
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {result.level}
          </span>
        </div>

        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1 p-0.5">
          {[1, 2, 3, 4].map((step) => {
            const isActive = result.score >= step;
            let barColor = "bg-gray-100";
            if (isActive) {
              if (result.score <= 1) barColor = "bg-rose-500";
              else if (result.score === 2) barColor = "bg-amber-500";
              else if (result.score === 3) barColor = "bg-teal-500";
              else barColor = "bg-emerald-500";
            }
            return (
              <div
                key={step}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  isActive ? barColor : "bg-gray-100"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Requirement Criteria Checklist */}
      {showRequirements && (
        <div className="p-2.5 rounded-[10px] bg-[#F8F9FA] border border-gray-100 space-y-1.5 mt-2">
          <div className="text-[10px] font-sans uppercase tracking-wider text-[#A0AEC0] font-bold mb-1">
            Security Criteria
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {result.requirements.map((req) => (
              <div
                key={req.id}
                className={`flex items-center gap-1.5 text-[11px] font-sans transition-colors ${
                  req.met ? "text-emerald-700 font-semibold" : "text-[#718096]"
                }`}
              >
                {req.met ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  </div>
                )}
                <span className="truncate">{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
