from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Defect, Inspection, InspectionStatus, Notification, Severity, User
from ..schemas import StatsResponse, TrendItem

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
def stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total = db.scalar(select(func.count()).select_from(Inspection)) or 0
    passed = db.scalar(select(func.count()).select_from(Inspection).where(Inspection.status == InspectionStatus.PASS)) or 0
    failed = db.scalar(select(func.count()).select_from(Inspection).where(Inspection.status == InspectionStatus.FAIL)) or 0
    yield_rate = round((passed / total) * 100, 2) if total > 0 else 100.0

    defects = db.scalar(select(func.count()).select_from(Defect)) or 0
    critical_defects = db.scalar(select(func.count()).select_from(Defect).where(Defect.severity == Severity.Critical)) or 0
    pending_reviews = db.scalar(select(func.count()).select_from(Inspection).where(Inspection.review_status == "PENDING")) or 0
    active_alerts = db.scalar(select(func.count()).select_from(Notification).where(Notification.is_read.is_(False))) or 0

    by_class = dict(db.execute(select(Defect.class_name, func.count()).group_by(Defect.class_name)).all())
    by_severity = {
        str(key.value if hasattr(key, "value") else key): value
        for key, value in db.execute(select(Defect.severity, func.count()).group_by(Defect.severity)).all()
    }

    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=29)

    # Inspections per day
    rows_inspections = db.execute(
        select(func.date(Inspection.captured_at), func.count(Inspection.id))
        .where(Inspection.captured_at >= start)
        .group_by(func.date(Inspection.captured_at))
    ).all()
    inspections_map = {row[0]: row[1] for row in rows_inspections}

    # Defects per day
    rows_defects = db.execute(
        select(func.date(Inspection.captured_at), func.count(Defect.id))
        .join(Defect, Defect.inspection_id == Inspection.id)
        .where(Inspection.captured_at >= start)
        .group_by(func.date(Inspection.captured_at))
    ).all()
    defects_map = {row[0]: row[1] for row in rows_defects}

    trend = [
        TrendItem(
            date=start + timedelta(days=i),
            inspections=inspections_map.get(str(start + timedelta(days=i)), inspections_map.get(start + timedelta(days=i), 0)),
            defects=defects_map.get(str(start + timedelta(days=i)), defects_map.get(start + timedelta(days=i), 0)),
        )
        for i in range(30)
    ]

    return StatsResponse(
        total_inspections=total,
        pass_count=passed,
        fail_count=failed,
        yield_rate=yield_rate,
        total_defects=defects,
        critical_defects=critical_defects,
        pending_reviews=pending_reviews,
        active_alerts=active_alerts,
        defects_by_class=by_class,
        defects_by_severity=by_severity,
        trend_last_30_days=trend,
    )
