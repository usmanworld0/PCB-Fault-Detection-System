import type { UserRole } from "@/types/models";

export type Permission =
  | "inspection.read"
  | "inspection.review"
  | "inspection.override"
  | "analytics.read"
  | "reports.read"
  | "reports.generate"
  | "notifications.read"
  | "users.read"
  | "users.manage"
  | "audit.read"
  | "settings.manage";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "ADMIN",
  engineer: "QUALITY ENGINEER",
  viewer: "VIEWER",
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "inspection.read",
    "inspection.review",
    "inspection.override",
    "analytics.read",
    "reports.read",
    "reports.generate",
    "notifications.read",
    "users.read",
    "users.manage",
    "audit.read",
    "settings.manage",
  ],
  engineer: [
    "inspection.read",
    "inspection.review",
    "inspection.override",
    "analytics.read",
    "reports.read",
    "reports.generate",
    "notifications.read",
  ],
  viewer: [
    "inspection.read",
    "analytics.read",
    "reports.read",
    "notifications.read",
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
