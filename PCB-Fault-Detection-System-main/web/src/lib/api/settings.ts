import { apiFetch } from "./client";
import { SystemSetting } from "@/types/models";

export async function getSettings(): Promise<{ settings: SystemSetting[] }> {
  return apiFetch<{ settings: SystemSetting[] }>("/settings");
}

export async function updateSettings(settings: Record<string, string>): Promise<{ settings: SystemSetting[] }> {
  return apiFetch<{ settings: SystemSetting[] }>("/settings", {
    method: "PATCH",
    body: JSON.stringify({ settings }),
  });
}
