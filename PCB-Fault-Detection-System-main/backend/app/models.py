import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    admin = "admin"
    engineer = "engineer"
    viewer = "viewer"


class InspectionStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class ReviewStatus(str, Enum):
    UNREVIEWED = "UNREVIEWED"
    CONFIRMED = "CONFIRMED"
    OVERRIDDEN = "OVERRIDDEN"


class Severity(str, Enum):
    Minor = "Minor"
    Moderate = "Moderate"
    Critical = "Critical"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.viewer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class Inspection(Base):
    __tablename__ = "inspections"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    source: Mapped[str] = mapped_column(String(255))
    model: Mapped[str] = mapped_column(String(100), index=True)
    status: Mapped[InspectionStatus] = mapped_column(SAEnum(InspectionStatus), index=True)
    image_url: Mapped[str] = mapped_column(String(1024))
    annotated_url: Mapped[str] = mapped_column(String(1024))
    station_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    local_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    review_status: Mapped[str] = mapped_column(String(50), default="UNREVIEWED", index=True)
    final_status: Mapped[InspectionStatus | None] = mapped_column(SAEnum(InspectionStatus), nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    defects: Mapped[list["Defect"]] = relationship(back_populates="inspection", cascade="all, delete-orphan")
    reviews: Mapped[list["Review"]] = relationship(back_populates="inspection", cascade="all, delete-orphan", order_by="Review.created_at.desc()")


class Defect(Base):
    __tablename__ = "defects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inspections.id", ondelete="CASCADE"), index=True)
    class_name: Mapped[str] = mapped_column("class", String(100), index=True)
    confidence: Mapped[float] = mapped_column(Float)
    severity: Mapped[Severity] = mapped_column(SAEnum(Severity), index=True)
    box_x1: Mapped[float] = mapped_column(Float)
    box_y1: Mapped[float] = mapped_column(Float)
    box_x2: Mapped[float] = mapped_column(Float)
    box_y2: Mapped[float] = mapped_column(Float)

    inspection: Mapped[Inspection] = relationship(back_populates="defects")


class Model(Base):
    __tablename__ = "models"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    arch: Mapped[str] = mapped_column(String(100))
    dataset: Mapped[str | None] = mapped_column(String(100), nullable=True)
    map50: Mapped[float | None] = mapped_column(Float, nullable=True)
    map50_95: Mapped[float | None] = mapped_column(Float, nullable=True)
    precision: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall: Mapped[float | None] = mapped_column(Float, nullable=True)
    f1: Mapped[float | None] = mapped_column(Float, nullable=True)
    cpu_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    metrics_json: Mapped[dict] = mapped_column(JSON)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inspections.id", ondelete="CASCADE"), index=True)
    automated_result: Mapped[InspectionStatus] = mapped_column(SAEnum(InspectionStatus))
    review_decision: Mapped[str] = mapped_column(String(50))  # CONFIRM, OVERRIDE_PASS, OVERRIDE_FAIL
    final_result: Mapped[InspectionStatus] = mapped_column(SAEnum(InspectionStatus))
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    reviewer_email: Mapped[str] = mapped_column(String(255))
    justification: Mapped[str] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, index=True)

    inspection: Mapped[Inspection] = relationship(back_populates="reviews")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    entity: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    details_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category: Mapped[str] = mapped_column(String(100), index=True)
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(50), default="Moderate")  # Critical, Moderate, Minor, Info
    inspection_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, index=True)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255))
    report_type: Mapped[str] = mapped_column(String(100), index=True)
    format: Mapped[str] = mapped_column(String(20))  # PDF, CSV
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED")
    summary_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    file_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    created_by_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, index=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    updated_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
