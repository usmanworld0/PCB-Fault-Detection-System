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
                System & Quality Control Parameters
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-surface-100 text-surface-700 border border-surface-200">
                CONFIGURATION
              </span>
            </div>
            <p className="text-xs text-surface-500 mt-1">
              Configure automated quality thresholds, alert triggers, and compliance parameters.
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
            <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-surface-900 uppercase tracking-wider">
                    Engineering Review Confidence Threshold
                  </h4>
                  <p className="text-xs text-surface-500 mt-0.5">
                    Defect detections with confidence below this threshold are automatically flagged for manual verification
                  </p>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  {formValues["review_confidence_threshold"] || "0.60"}
                </span>
              </div>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={formValues["review_confidence_threshold"] || "0.60"}
                onChange={(e) => handleChange("review_confidence_threshold", e.target.value)}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>

            {/* Setting 2: Critical defect alert behavior */}
            <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
              <h4 className="text-xs font-bold text-surface-900 uppercase tracking-wider mb-1">
                Critical Defect Instant Alerts
              </h4>
              <p className="text-xs text-surface-500 mb-3">
                Trigger instant system notifications and audit alerts when open or short circuits are identified
              </p>
              <select
                value={formValues["critical_alert_enabled"] || "true"}
                onChange={(e) => handleChange("critical_alert_enabled", e.target.value)}
                className="px-3 py-2 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              >
                <option value="true">Enabled (Immediate Critical Alarm)</option>
                <option value="false">Disabled (Log Only)</option>
              </select>
            </div>

            {/* Setting 3: Default analytics date range */}
            <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
              <h4 className="text-xs font-bold text-surface-900 uppercase tracking-wider mb-1">
                Default Analytics Window
              </h4>
              <p className="text-xs text-surface-500 mb-3">
                Default time horizon shown across operations dashboard charts
              </p>
              <select
                value={formValues["default_analytics_range_days"] || "30"}
                onChange={(e) => handleChange("default_analytics_range_days", e.target.value)}
                className="px-3 py-2 bg-white border border-surface-200 rounded text-xs text-surface-800 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days (Standard)</option>
                <option value="90">90 Days (Quarterly)</option>
              </select>
            </div>

            {/* Setting 4: Report Branding */}
            <div className="bg-white border border-surface-200 rounded-lg p-5 shadow-sm">
              <h4 className="text-xs font-bold text-surface-900 uppercase tracking-wider mb-1">
                Official Quality Report Branding Title
              </h4>
              <p className="text-xs text-surface-500 mb-2">
                Header name stamped on generated quality reports and compliance exports
              </p>
              <input
                type="text"
                value={formValues["report_branding"] || "PCB-Vision Industrial QC"}
                onChange={(e) => handleChange("report_branding", e.target.value)}
                className="w-full p-2 bg-white border border-surface-200 rounded text-xs text-surface-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Submit Bar */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
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
