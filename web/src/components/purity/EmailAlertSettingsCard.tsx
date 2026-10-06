"use client";

import React, { useState, useEffect } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import {
  getEmailAlertSettings,
  saveEmailAlertSettings,
  EmailAlertSettings,
  DEFAULT_EMAIL_SETTINGS,
} from "@/lib/services/emailService";

export function EmailAlertSettingsCard() {
  const [settings, setSettings] = useState<EmailAlertSettings>(DEFAULT_EMAIL_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loaded = getEmailAlertSettings();
    setSettings(loaded);
  }, []);

  const handleToggle = (newVal: boolean) => {
    const updated = { ...settings, enabled: newVal };
    setSettings(updated);
    saveEmailAlertSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-white border border-gray-200/70 rounded-[15px] p-5 sm:p-6 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] space-y-4 font-sans">
      {/* Card Header & Main Notification On/Off Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-teal-50 border border-teal-100 text-[#4FD1C5] flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#2D3748]">
                Admin Email Notifications (SMTP)
              </h3>
              {settings.enabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active &bull; SMTP Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  Disabled
                </span>
              )}
              {savedSuccess && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200 animate-fade-in">
                  Saved
                </span>
              )}
            </div>
            <p className="text-xs text-[#A0AEC0] font-semibold mt-1">
              Dispatches automated email alerts with defect telemetry and direct workstation links when inspections fail.
            </p>
          </div>
        </div>

        {/* Notification On/Off Toggle Switch */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <span className="text-xs font-bold text-[#2D3748]">
            {settings.enabled ? "ALERTS ON" : "ALERTS OFF"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => handleToggle(!settings.enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] focus:ring-offset-2 ${
              settings.enabled ? "bg-[#4FD1C5]" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Trigger Criteria Pills */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs text-[#718096]">
        <span className="text-[11px] font-bold text-[#2D3748] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#4FD1C5]" />
          Trigger Criteria:
        </span>
        <span className="px-2.5 py-1 rounded-[6px] bg-rose-50 border border-rose-100 text-[#E53E3E] font-bold text-[10px] uppercase tracking-wider">
          &bull; Inspection Status = FAIL
        </span>
        <span className="px-2.5 py-1 rounded-[6px] bg-amber-50 border border-amber-100 text-amber-700 font-bold text-[10px] uppercase tracking-wider">
          &bull; Critical Defect Flaws
        </span>
        <span className="text-[11px] text-[#A0AEC0] font-semibold">
          (via SMTP server: Gmail / Custom SMTP)
        </span>
      </div>
    </div>
  );
}
