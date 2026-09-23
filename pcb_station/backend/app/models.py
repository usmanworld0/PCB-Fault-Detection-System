import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
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


class Severity(str, Enum):
    Minor = "Minor"
    Moderate = "Moderate"
    Critical = "Critical"


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.viewer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)


class Inspection(Base):
    __tablename__ = "inspections"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    source: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[InspectionStatus] = mapped_column(SAEnum(InspectionStatus), index=True)
    image_url: Mapped[str] = mapped_column(String)
    annotated_url: Mapped[str] = mapped_column(String)
    station_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    defects: Mapped[list["Defect"]] = relationship(back_populates="inspection", cascade="all, delete-orphan")


class Defect(Base):
    __tablename__ = "defects"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inspections.id", ondelete="CASCADE"), index=True)
    class_name: Mapped[str] = mapped_column("class", String)
    confidence: Mapped[float] = mapped_column(Float)
    severity: Mapped[Severity] = mapped_column(SAEnum(Severity))
    box_x1: Mapped[float] = mapped_column(Float)
    box_y1: Mapped[float] = mapped_column(Float)
    box_x2: Mapped[float] = mapped_column(Float)
    box_y2: Mapped[float] = mapped_column(Float)
    inspection: Mapped[Inspection] = relationship(back_populates="defects")


class Model(Base):
    __tablename__ = "models"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    arch: Mapped[str] = mapped_column(String)
    dataset: Mapped[str | None] = mapped_column(String, nullable=True)
    map50: Mapped[float | None] = mapped_column(Float, nullable=True)
    map50_95: Mapped[float | None] = mapped_column(Float, nullable=True)
    precision: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall: Mapped[float | None] = mapped_column(Float, nullable=True)
    f1: Mapped[float | None] = mapped_column(Float, nullable=True)
    cpu_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    metrics_json: Mapped[dict] = mapped_column(JSONB)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
