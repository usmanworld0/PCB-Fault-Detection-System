"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  getEmailAlertSettings,
  saveEmailAlertSettings,
  sendTestEmail,
  EmailAlertSettings,
  DEFAULT_EMAIL_SETTINGS,
} from "@/lib/services/emailService";
import { useAuth } from "@/lib/auth/AuthContext";

export function EmailAlertSettingsCard() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [settings, setSettings] = useState<EmailAlertSettings>(DEFAULT_EMAIL_SETTINGS);
  const [emailInput, setEmailInput] = useState(DEFAULT_EMAIL_SETTINGS.recipientEmail);
  const [adminRecipients, setAdminRecipients] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loaded = getEmailAlertSettings();
    if (isAdmin && user?.email && !localStorage.getItem("pcb_vision_email_alert_settings")) {
      loaded.recipientEmail = user.email;
    }
    setSettings(loaded);
    setEmailInput(loaded.recipientEmail);

    fetch("/api/notifications/email")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.admin_recipients)) {
          setAdminRecipients(data.admin_recipients);
        }
        if (data.primary_admin && !localStorage.getItem("pcb_vision_email_alert_settings")) {
          setEmailInput(data.primary_admin);
        }
      })
      .catch(() => {});
  }, [user, isAdmin]);


  const handleToggle = (newVal: boolean) => {
    const updated = { ...settings, enabled: newVal };
    setSettings(updated);
    saveEmailAlertSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...settings, recipientEmail: emailInput.trim() };
    setSettings(updated);
    saveEmailAlertSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await sendTestEmail(emailInput.trim());
      setTestResult({
        success: true,
        message: `Test email successfully delivered to ${emailInput.trim()} via SMTP!`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to deliver test email.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200/70 rounded-[15px] p-5 sm:p-6 shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] space-y-4 font-sans">
      {/* Card Header & Main Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
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
            </div>
            <p className="text-xs text-[#A0AEC0] font-semibold mt-1">
              Dispatches automated email alerts with defect telemetry and direct workstation links when inspections fail.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
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

      {/* Recipient Configuration & Test Action */}
      <div className="space-y-3">
        {adminRecipients.length > 0 && (
          <div className="p-3 bg-[#F8F9FA] border border-gray-200/70 rounded-[10px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">
                Registered Admin Recipients ({adminRecipients.length})
              </span>
              <span className="text-[10px] text-teal-600 font-semibold">
                Auto-Broadcast Enabled
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {adminRecipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white border border-gray-200 text-[#2D3748] text-[11px] font-semibold font-mono"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4FD1C5]"></span>
                  {email}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[#A0AEC0]">
              All active registered administrators receive real-time defect email alerts.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <form onSubmit={handleSaveEmail} className="md:col-span-8 space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A0AEC0]">
              Additional Recipient / Test Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@manufacturing.org"
                className="flex-1 px-3.5 py-2.5 bg-[#F8F9FA] border border-gray-200/80 rounded-[10px] text-xs font-semibold text-[#2D3748] focus:outline-none focus:ring-1 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] focus:bg-white transition-all shadow-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-[10px] bg-white hover:bg-gray-50 border border-gray-200/80 text-xs font-bold uppercase tracking-wider text-[#2D3748] shadow-[0px_3.5px_5.5px_rgba(0,0,0,0.02)] transition-colors shrink-0"
              >
                {savedSuccess ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </span>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </form>

        <div className="md:col-span-4 flex items-center justify-end">
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={isTesting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#4FD1C5] hover:bg-[#319795] text-white text-xs font-bold uppercase tracking-wider shadow-[0_2px_6px_rgba(79,209,197,0.3)] transition-colors disabled:opacity-50 shrink-0"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending Test...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Email</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>


      {/* Trigger Criteria Pills */}
      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#718096]">
        <span className="text-[11px] font-bold text-[#2D3748] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#4FD1C5]" />
          Trigger Criteria:
        </span>
        <span className="px-2.5 py-1 rounded-[6px] bg-rose-50 border border-rose-100 text-[#E53E3E] font-bold text-[10px] uppercase tracking-wider">
          • Inspection Status = FAIL
        </span>
        <span className="px-2.5 py-1 rounded-[6px] bg-amber-50 border border-amber-100 text-amber-700 font-bold text-[10px] uppercase tracking-wider">
          • Critical Defect Flaws
        </span>
        <span className="text-[11px] text-[#A0AEC0] font-semibold">
          (via SMTP server: Gmail / Custom SMTP)
        </span>
      </div>

      {/* Test Result Feedback Alert */}
      {testResult && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-[10px] text-xs font-medium animate-fade-in ${
            testResult.success
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}
    </div>
  );
}
