from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import InspectionStatus, Severity, UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


class RegisterRequest(LoginRequest):
    role: UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: EmailStr
    role: UserRole
    created_at: datetime


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


class InspectionListItem(BaseModel):
    id: UUID
    captured_at: datetime
    status: InspectionStatus
    model: str
    defect_count: int
    image_url: str


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
    station_id: str | None
    created_at: datetime
    defects: list[DefectResponse]


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
    total_defects: int
    defects_by_class: dict[str, int]
    defects_by_severity: dict[str, int]
    trend_last_30_days: list[TrendItem]
