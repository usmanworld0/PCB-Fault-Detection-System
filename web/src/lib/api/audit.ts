import { getSupabase } from "@/lib/supabase";
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
  try {
    const supabase = getSupabase();
    let query = supabase.from("audit_logs").select("*", { count: "exact" });
    if (params.action) query = query.eq("action", params.action);
    if (params.user_email) query = query.ilike("user_email", `%${params.user_email}%`);
    if (params.date_from) query = query.gte("created_at", params.date_from);
    if (params.date_to) query = query.lte("created_at", params.date_to);

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      items: data || [],
      total: count ?? (data?.length || 0),
    };
  } catch {
    const searchParams = new URLSearchParams();
    if (params.action) searchParams.set("action", params.action);
    if (params.user_email) searchParams.set("user_email", params.user_email);
    if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
    if (params.offset !== undefined) searchParams.set("offset", params.offset.toString());
    const query = searchParams.toString();
    return apiFetch<AuditLogListApiResponse>(`/audit-logs${query ? `?${query}` : ""}`);
  }
}
