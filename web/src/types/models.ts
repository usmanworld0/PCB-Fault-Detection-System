export type UserRole = "admin" | "engineer" | "viewer";

export type InspectionStatus = "PASS" | "FAIL";

export type Severity = "Minor" | "Moderate" | "Critical";

export type ReviewStatus = "UNREVIEWED" | "PENDING" | "CONFIRMED" | "OVERRIDDEN";

export type ReviewDecision = "CONFIRM" | "OVERRIDE_PASS" | "OVERRIDE_FAIL";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Defect {
  id: string;
  class: string;
  confidence: number;
  severity: Severity;
  box_x1: number;
  box_y1: number;
  box_x2: number;
  box_y2: number;
}

export interface Review {
  id: string;
  inspection_id: string;
  automated_result: InspectionStatus;
  review_decision: string;
  final_result: InspectionStatus;
  reviewer_id?: string;
  reviewer_email: string;
  justification: string;
  notes?: string;
  created_at: string;
}

export interface InspectionListItem {
  id: string;
  captured_at: string;
  status: InspectionStatus;
  model: string;
  defect_count: number;
  image_url: string;
  station_id?: string;
  review_status: ReviewStatus | string;
  final_status?: InspectionStatus;
  operator_email?: string;
  operator_role?: string;
}

export interface InspectionDetail {
  id: string;
  captured_at: string;
  source: string;
  model: string;
  status: InspectionStatus;
  image_url: string;
  annotated_url: string;
  station_id?: string;
  local_id?: number;
  review_status: ReviewStatus | string;
  final_status?: InspectionStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  operator_email?: string;
  operator_role?: string;
  defects: Defect[];
  reviews?: Review[];
}

export interface TrendItem {
  date: string;
  inspections: number;
  defects: number;
}

export interface Stats {
  total_inspections: number;
  pass_count: number;
  fail_count: number;
  yield_rate: number;
  total_defects: number;
  critical_defects: number;
  pending_reviews: number;
  active_alerts: number;
  defects_by_class: Record<string, number>;
  defects_by_severity: Record<string, number>;
  trend_last_30_days: TrendItem[];
}

export interface ModelMetric {
  id: string;
  name: string;
  arch: string;
  dataset?: string;
  map50?: number;
  map50_95?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  cpu_ms?: number;
  metrics_json: Record<string, any>;
  uploaded_at: string;
}

export interface Notification {
  id: string;
  category: string;
  title: string;
  message: string;
  severity: "Critical" | "Moderate" | "Minor" | "Info" | string;
  inspection_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  report_type: string;
  format: "CSV" | "PDF" | string;
  status: string;
  summary_json?: Record<string, any>;
  file_url?: string;
  created_by_email?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  description: string;
  details_json?: Record<string, any>;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
  updated_by?: string;
}
