from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_role
from ..db import get_db
from ..models import AuditLog, SystemSetting, User, UserRole
from ..schemas import SystemSettingItem, SystemSettingsResponse, SystemSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "review_confidence_threshold": ("0.60", "Threshold below which detections are flagged for human review"),
    "critical_alert_enabled": ("true", "Trigger instant notification for open and short circuits"),
    "default_analytics_range_days": ("30", "Default time window for analytics charts"),
    "report_branding": ("PCB-Vision Industrial QC", "Title displayed on official inspection reports"),
    "inspection_station_prefix": ("STATION", "Prefix for workstation identification"),
}


def _ensure_default_settings(db: Session):
    for key, (val, desc) in DEFAULT_SETTINGS.items():
        if not db.get(SystemSetting, key):
            db.add(SystemSetting(key=key, value=val, description=desc))
    db.commit()


@router.get("", response_model=SystemSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _ensure_default_settings(db)
    items = db.scalars(select(SystemSetting).order_by(SystemSetting.key)).all()
    return SystemSettingsResponse(
        settings=[
            SystemSettingItem(
                key=s.key,
                value=s.value,
                description=s.description,
                updated_at=s.updated_at,
                updated_by=s.updated_by,
            )
            for s in items
        ]
    )


@router.patch("", response_model=SystemSettingsResponse)
def update_settings(
    payload: SystemSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    _ensure_default_settings(db)
    updated_keys = []
    for key, value in payload.settings.items():
        setting = db.get(SystemSetting, key)
        if setting:
            setting.value = str(value)
            setting.updated_at = datetime.now(timezone.utc)
            setting.updated_by = current_user.email
            updated_keys.append(f"{key}={value}")

    if updated_keys:
        db.add(
            AuditLog(
                user_id=current_user.id,
                user_email=current_user.email,
                action="SETTINGS_CHANGED",
                entity="system_settings",
                entity_id="global",
                description=f"Admin {current_user.email} updated settings: {', '.join(updated_keys)}",
                details_json=payload.settings,
            )
        )
        db.commit()

    items = db.scalars(select(SystemSetting).order_by(SystemSetting.key)).all()
    return SystemSettingsResponse(
        settings=[
            SystemSettingItem(
                key=s.key,
                value=s.value,
                description=s.description,
                updated_at=s.updated_at,
                updated_by=s.updated_by,
            )
            for s in items
        ]
    )
