from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Defect, Inspection, InspectionStatus, User
from ..schemas import StatsResponse, TrendItem

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=StatsResponse)
def stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total = db.scalar(select(func.count()).select_from(Inspection)) or 0
    passed = db.scalar(select(func.count()).select_from(Inspection).where(Inspection.status == InspectionStatus.PASS)) or 0
    failed = db.scalar(select(func.count()).select_from(Inspection).where(Inspection.status == InspectionStatus.FAIL)) or 0
    defects = db.scalar(select(func.count()).select_from(Defect)) or 0
    by_class = dict(db.execute(select(Defect.class_name, func.count()).group_by(Defect.class_name)).all())
    by_severity = {str(key.value if hasattr(key, "value") else key): value for key, value in db.execute(select(Defect.severity, func.count()).group_by(Defect.severity)).all()}
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=29)
    rows = db.execute(select(func.date(Inspection.captured_at), func.count(Inspection.id), func.count(Defect.id)).outerjoin(Defect).where(Inspection.captured_at >= start).group_by(func.date(Inspection.captured_at))).all()
    activity = {row[0]: (row[1], row[2]) for row in rows}
    trend = [TrendItem(date=start + timedelta(days=i), inspections=activity.get(start + timedelta(days=i), (0, 0))[0], defects=activity.get(start + timedelta(days=i), (0, 0))[1]) for i in range(30)]
    return StatsResponse(total_inspections=total, pass_count=passed, fail_count=failed, total_defects=defects,
                         defects_by_class=by_class, defects_by_severity=by_severity, trend_last_30_days=trend)
