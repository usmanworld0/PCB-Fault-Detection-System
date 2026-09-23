import { apiFetch } from "./client";
import { AuditLogListApiResponse } from "@/types/api";

export interface AuditLogParams {
  action?: string;
  user_email?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export async function getAuditLogs(params: AuditLogParams = {}): Promise<AuditLogListApiResponse> {
  const searchParams = new URLSearchParams();
  if (params.action) searchParams.set("action", params.action);
  if (params.user_email) searchParams.set("user_email", params.user_email);
  if (params.date_from) searchParams.set("date_from", params.date_from);
  if (params.date_to) searchParams.set("date_to", params.date_to);
  if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
  if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<AuditLogListApiResponse>(`/audit-logs${query ? `?${query}` : ""}`);
}
