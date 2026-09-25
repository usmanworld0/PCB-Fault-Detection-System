from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import InspectionStatus, ReviewStatus, Severity, UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: UUID | None = None
    email: str | None = None


class RegisterRequest(LoginRequest):
    role: UserRole = UserRole.viewer


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    role: UserRole
    is_active: bool = True
    created_at: datetime


class UserAdminView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime


class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    role: UserRole = UserRole.viewer


class UserUpdateAdmin(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class DefectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    class_name: str = Field(validation_alias="class_name", serialization_alias="class")
    confidence: float
    severity: Severity
    box_x1: float
    box_y1: float
    box_x2: float
    box_y2: float


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    inspection_id: UUID
    automated_result: InspectionStatus
    review_decision: str
    final_result: InspectionStatus
    reviewer_id: UUID | None = None
    reviewer_email: str
    justification: str
    notes: str | None = None
    created_at: datetime


class ReviewCreate(BaseModel):
    inspection_id: UUID
    review_decision: str = Field(description="CONFIRM, OVERRIDE_PASS, or OVERRIDE_FAIL")
    justification: str = Field(default="", description="Required if overriding result")
    notes: str | None = None


class InspectionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    captured_at: datetime
    status: InspectionStatus
    model: str
    defect_count: int
    image_url: str
    station_id: str | None = None
    review_status: str = "UNREVIEWED"
    final_status: InspectionStatus | None = None
    operator_email: str | None = None
    operator_role: str | None = None


class InspectionListResponse(BaseModel):
    total: int
    items: list[InspectionListItem]


class InspectionDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    captured_at: datetime
    source: str
    model: str
    status: InspectionStatus
    image_url: str
    annotated_url: str
    station_id: str | None = None
    local_id: int | None = None
    review_status: str = "UNREVIEWED"
    final_status: InspectionStatus | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    operator_email: str | None = None
    operator_role: str | None = None
    created_at: datetime
    defects: list[DefectResponse]
    reviews: list[ReviewResponse] = []


class ModelIngest(BaseModel):
    name: str = Field(min_length=1)
    arch: str = Field(min_length=1)
    dataset: str | None = None
    model_config = ConfigDict(extra="allow")


class ModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    arch: str
    dataset: str | None
    map50: float | None
    map50_95: float | None
    precision: float | None
    recall: float | None
    f1: float | None
    cpu_ms: float | None
    metrics_json: dict[str, Any]
    uploaded_at: datetime


class TrendItem(BaseModel):
    date: date
    inspections: int
    defects: int


class StatsResponse(BaseModel):
    total_inspections: int
    pass_count: int
    fail_count: int
    yield_rate: float
    total_defects: int
    critical_defects: int
    pending_reviews: int
    active_alerts: int
    defects_by_class: dict[str, int]
    defects_by_severity: dict[str, int]
    trend_last_30_days: list[TrendItem]


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    timestamp: datetime
    user_id: UUID | None = None
    user_email: str | None = None
    action: str
    entity: str
    entity_id: str | None = None
    description: str
    details_json: dict[str, Any] | None = None


class AuditLogListResponse(BaseModel):
    total: int
    items: list[AuditLogResponse]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    category: str
    title: str
    message: str
    severity: str
    inspection_id: UUID | None = None
    is_read: bool
    created_at: datetime


class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    items: list[NotificationResponse]


class ReportCreate(BaseModel):
    title: str
    report_type: str = Field(description="Inspection Summary, Defect Analysis, Quality Report, Model Performance Report")
    format: str = Field(default="CSV", description="CSV or PDF")
    date_from: datetime | None = None
    date_to: datetime | None = None
    status: InspectionStatus | None = None
    model: str | None = None
    defect_class: str | None = None
    station_id: str | None = None


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    report_type: str
    format: str
    status: str
    summary_json: dict[str, Any] | None = None
    file_url: str | None = None
    created_by_email: str | None = None
    created_at: datetime


class SystemSettingItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    key: str
    value: str
    description: str | None = None
    updated_at: datetime
    updated_by: str | None = None


class SystemSettingsResponse(BaseModel):
    settings: list[SystemSettingItem]


class SystemSettingsUpdate(BaseModel):
    settings: dict[str, str]
