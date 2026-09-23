from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import require_role
from ..db import get_db
from ..models import AuditLog, User, UserRole
from ..schemas import AuditLogListResponse, AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["audit"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    action: str | None = None,
    user_email: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
    if user_email:
        query = query.where(AuditLog.user_email.ilike(f"%{user_email.strip()}%"))
    if date_from:
        query = query.where(AuditLog.timestamp >= date_from)
    if date_to:
        query = query.where(AuditLog.timestamp <= date_to)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    logs = db.scalars(query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit)).all()

    return AuditLogListResponse(total=total, items=logs)
