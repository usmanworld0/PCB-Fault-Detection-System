"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, CheckCircle2, Shield, Sliders } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/common/LoadingSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { getSettings, updateSettings } from "@/lib/api/settings";
import { SystemSetting } from "@/types/models";

export default function SettingsPage() {
  const [settingsList, setSettingsList] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable settings map
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const fetchSystemSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSettings();
      setSettingsList(res.settings);
      const initialMap: Record<string, string> = {};
      res.settings.forEach((s) => {
        initialMap[s.key] = s.value;
      });
      setFormValues(initialMap);
    } catch (err: any) {
      setError(err.message || "Failed to load operational settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateSettings(formValues);
      setSuccess("Settings saved successfully and logged to audit trail.");
      fetchSystemSettings();
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <AppShell>
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-surface-900">
                Settings
              </h1>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Configure system thresholds and preferences.
            </p>
          </div>
        </div>

        {error && <ErrorState message={error} onRetry={fetchSystemSettings} />}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Setting 1: Confidence threshold */}
            <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-industrial-50 text-industrial-700 border border-industrial-200 shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-surface-900 tracking-tight">
                      Engineering Review Confidence Threshold
                    </h4>
                    <p className="text-xs text-surface-500 mt-0.5">
                      Defect detections with confidence below this threshold are automatically flagged for manual verification.
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-industrial-50 text-industrial-700 border border-industrial-200 shrink-0">
                  {formValues["review_confidence_threshold"] || "0.60"}
                </span>
              </div>
              <div className="space-y-1.5 pt-2">
                <input
                  type="range"
                  min="0.30"
                  max="0.95"
                  step="0.05"
                  value={formValues["review_confidence_threshold"] || "0.60"}
                  onChange={(e) => handleChange("review_confidence_threshold", e.target.value)}
                  className="w-full accent-industrial-600 cursor-pointer h-2 bg-surface-100 rounded-lg"
                />
                <div className="flex justify-between text-[10px] font-mono text-surface-400">
                  <span>0.30 (Relaxed)</span>
                  <span>0.60 (Standard)</span>
                  <span>0.95 (Strict)</span>
                </div>
              </div>
            </div>

            {/* Setting 2: Critical defect alert behavior */}
            <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-surface-900 tracking-tight">
                    Critical Defect Instant Alerts
                  </h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Trigger instant system notifications and audit alerts when open or short circuits are identified.
                  </p>
                </div>
              </div>
              <select
                value={formValues["critical_alert_enabled"] || "true"}
                onChange={(e) => handleChange("critical_alert_enabled", e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 font-mono shadow-xs"
              >
                <option value="true">Enabled (Immediate Critical Alarm)</option>
                <option value="false">Disabled (Log Only)</option>
              </select>
            </div>

            {/* Setting 3: Default analytics date range */}
            <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-surface-900 tracking-tight">
                    Default Analytics Window
                  </h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Default time horizon shown across operations dashboard charts.
                  </p>
                </div>
              </div>
              <select
                value={formValues["default_analytics_range_days"] || "30"}
                onChange={(e) => handleChange("default_analytics_range_days", e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 font-mono shadow-xs"
              >
                <option value="7">7 Days (Weekly)</option>
                <option value="30">30 Days (Monthly Standard)</option>
                <option value="90">90 Days (Quarterly SPC)</option>
              </select>
            </div>

            {/* Setting 4: Report Branding */}
            <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-xl bg-industrial-50 text-industrial-700 border border-industrial-200 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-surface-900 tracking-tight">
                    Official Quality Report Branding Title
                  </h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Header name stamped on generated quality reports and compliance exports.
                  </p>
                </div>
              </div>
              <input
                type="text"
                value={formValues["report_branding"] || "PCB-Vision Industrial QC"}
                onChange={(e) => handleChange("report_branding", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-surface-200 rounded-lg text-xs sm:text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-industrial-500/20 focus:border-industrial-500 shadow-xs"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
