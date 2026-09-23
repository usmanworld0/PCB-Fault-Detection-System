import { apiFetch } from "./client";
import { ReportGeneratePayload } from "@/types/api";
import { Report } from "@/types/models";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getReports(): Promise<Report[]> {
  return apiFetch<Report[]>("/reports");
}

export async function generateReport(payload: ReportGeneratePayload): Promise<Report> {
  return apiFetch<Report>("/reports/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReportDownloadUrl(reportId: string): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("pcb_access_token") : "";
  return `${API_BASE_URL}/reports/${reportId}/download${token ? `?token=${token}` : ""}`;
}
