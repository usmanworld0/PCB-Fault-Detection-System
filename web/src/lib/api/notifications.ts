import { apiFetch } from "./client";
import { NotificationListApiResponse } from "@/types/api";
import { Notification } from "@/types/models";

export async function getNotifications(unreadOnly = false): Promise<NotificationListApiResponse> {
  const query = unreadOnly ? "?unread_only=true" : "";
  return apiFetch<NotificationListApiResponse>(`/notifications${query}`);
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/notifications/read-all", {
    method: "POST",
  });
}
