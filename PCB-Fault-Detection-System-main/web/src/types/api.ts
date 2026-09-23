import {
  AuditLog,
  InspectionDetail,
  InspectionListItem,
  ModelMetric,
  Notification,
  Report,
  Review,
  Stats,
  SystemSetting,
  User,
  UserRole,
} from "./models";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_id?: string;
  email?: string;
}

export interface InspectionListParams {
  status?: string;
  model?: string;
  date_from?: string;
  date_to?: string;
  defect_class?: string;
  station_id?: string;
  review_status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface InspectionListApiResponse {
  total: number;
  items: InspectionListItem[];
}

export interface ReviewQueueParams {
  filter_status?: "PENDING" | "COMPLETED" | "ALL";
  limit?: number;
  offset?: number;
}

export interface ReviewSubmitPayload {
  inspection_id: string;
  review_decision: "CONFIRM" | "OVERRIDE_PASS" | "OVERRIDE_FAIL";
  justification: string;
  notes?: string;
}

export interface NotificationListApiResponse {
  total: number;
  unread_count: number;
  items: Notification[];
}

export interface AuditLogListApiResponse {
  total: number;
  items: AuditLog[];
}

export interface ReportGeneratePayload {
  title: string;
  report_type: string;
  format?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  model?: string;
  defect_class?: string;
  station_id?: string;
}

export interface UserCreatePayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface UserUpdatePayload {
  role?: UserRole;
  is_active?: boolean;
}
