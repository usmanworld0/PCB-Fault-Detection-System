import { getSupabase } from "@/lib/supabase";
import { apiFetch } from "./client";
import { NotificationListApiResponse } from "@/types/api";
import { Notification } from "@/types/models";

export async function getNotifications(unreadOnly = false): Promise<NotificationListApiResponse> {
  try {
    const supabase = getSupabase();
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (unreadOnly) {
      query = query.eq("is_read", false);
    }
    const { data, error } = await query;
    if (error) throw error;
    const items = data || [];
    const unreadCount = items.filter((n: any) => !n.is_read).length;
    return {
      items,
      total: items.length,
      unread_count: unreadCount,
    };
  } catch {
    try {
      const query = unreadOnly ? "?unread_only=true" : "";
      return await apiFetch<NotificationListApiResponse>(`/notifications${query}`);
    } catch {
      return {
        items: [],
        total: 0,
        unread_count: 0,
      };
    }
  }
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw error;
    return data;
  } catch {
    return apiFetch<Notification>(`/notifications/${id}/read`, { method: "PATCH" });
  }
}

export async function markAllNotificationsAsRead(): Promise<{ status: string }> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    if (error) throw error;
    return { status: "all marked read" };
  } catch {
    return apiFetch<{ status: string }>("/notifications/read-all", { method: "POST" });
  }
}
