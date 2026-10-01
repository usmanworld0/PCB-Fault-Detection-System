export interface EmailAlertSettings {
  enabled: boolean;
  recipientEmail: string;
  notifyOnFailOnly: boolean;
  notifyOnCriticalOnly: boolean;
}

const SETTINGS_KEY = "pcb_vision_email_alert_settings";

export const DEFAULT_EMAIL_SETTINGS: EmailAlertSettings = {
  enabled: true,
  recipientEmail: "world.usman.business@gmail.com",
  notifyOnFailOnly: true,
  notifyOnCriticalOnly: false,
};

export function getEmailAlertSettings(): EmailAlertSettings {
  if (typeof window === "undefined") {
    return DEFAULT_EMAIL_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_EMAIL_SETTINGS;
    return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_EMAIL_SETTINGS;
  }
}

export function saveEmailAlertSettings(settings: EmailAlertSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save email alert settings:", err);
  }
}

export async function sendTestEmail(recipient?: string): Promise<{ success: boolean; message: string }> {
  const currentSettings = getEmailAlertSettings();
  const target = recipient || currentSettings.recipientEmail || "world.usman.business@gmail.com";

  const res = await fetch("/api/notifications/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "test",
      recipient: target,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to dispatch test email.");
  }
  return data;
}

export interface DefectAlertData {
  id: string;
  pcb_id?: string;
  station_id?: string;
  status: string;
  operator_email?: string;
  model?: string;
  defects?: Array<{ class: string; severity?: string; confidence: number }>;
  captured_at?: string;
}

export async function triggerDefectEmailAlert(
  inspection: DefectAlertData
): Promise<{ success: boolean; message: string; skipped?: boolean }> {
  const settings = getEmailAlertSettings();

  // If admin has toggled off email notifications, skip dispatch
  if (!settings.enabled) {
    return {
      success: true,
      skipped: true,
      message: "Admin email notifications are currently toggled OFF.",
    };
  }

  // Filter based on critical only if configured
  if (settings.notifyOnCriticalOnly) {
    const hasCritical = inspection.defects?.some(
      (d) => d.severity?.toLowerCase() === "critical"
    );
    if (!hasCritical) {
      return {
        success: true,
        skipped: true,
        message: "No critical defects detected. Skipping email alert per settings.",
      };
    }
  }

  const res = await fetch("/api/notifications/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "inspection_failed",
      inspection,
      recipient: settings.recipientEmail || "world.usman.business@gmail.com",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to dispatch defect alert email.");
  }
  return data;
}
