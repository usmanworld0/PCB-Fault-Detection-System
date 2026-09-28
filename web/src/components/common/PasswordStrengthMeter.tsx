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
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-surface-500 font-medium">Password Strength:</span>
          <span
            className={`font-bold uppercase tracking-wider ${
              result.level === "Strong"
                ? "text-emerald-600"
                : result.level === "Good"
                ? "text-sky-600"
                : result.level === "Fair"
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {result.level}
          </span>
        </div>

        <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden flex gap-1 p-0.5">
          {[1, 2, 3, 4].map((step) => {
            const isActive = result.score >= step;
            let barColor = "bg-surface-200";
            if (isActive) {
              if (result.score <= 1) barColor = "bg-rose-500";
              else if (result.score === 2) barColor = "bg-amber-500";
              else if (result.score === 3) barColor = "bg-sky-500";
              else barColor = "bg-emerald-500";
            }
            return (
              <div
                key={step}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  isActive ? barColor : "bg-surface-200"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Requirement Criteria Checklist */}
      {showRequirements && (
        <div className="p-2.5 rounded-lg bg-surface-50 border border-surface-200/80 space-y-1.5 mt-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-surface-400 font-semibold mb-1">
            Security Criteria
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {result.requirements.map((req) => (
              <div
                key={req.id}
                className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${
                  req.met ? "text-emerald-700 font-medium" : "text-surface-500"
                }`}
              >
                {req.met ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-surface-200 flex items-center justify-center shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-surface-400" />
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
