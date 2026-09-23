import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Notification, User
from ..schemas import NotificationListResponse, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    category: str | None = None,
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = select(Notification)
    if category:
        query = query.where(Notification.category == category)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    unread_count = db.scalar(
        select(func.count()).select_from(Notification).where(Notification.is_read.is_(False))
    ) or 0

    items = db.scalars(
        query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
    ).all()

    return NotificationListResponse(total=total, unread_count=unread_count, items=items)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/read-all")
def mark_all_as_read(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    db.execute(update(Notification).where(Notification.is_read.is_(False)).values(is_read=True))
    db.commit()
    return {"status": "ok", "message": "All notifications marked as read"}
