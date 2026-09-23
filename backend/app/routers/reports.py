import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..db import get_db
from ..models import AuditLog, Defect, Inspection, Model, Report, User
from ..schemas import ReportCreate, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportResponse])
def list_reports(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    reports = db.scalars(select(Report).order_by(Report.created_at.desc())).all()
    return reports


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    payload: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Query inspections matching filters
    query = select(Inspection).options(selectinload(Inspection.defects))
    if payload.status:
        query = query.where(Inspection.status == payload.status)
    if payload.model:
        query = query.where(Inspection.model == payload.model)
    if payload.station_id:
        query = query.where(Inspection.station_id == payload.station_id)
    if payload.date_from:
        query = query.where(Inspection.captured_at >= payload.date_from)
    if payload.date_to:
        query = query.where(Inspection.captured_at <= payload.date_to)
    if payload.defect_class:
        query = query.where(Inspection.defects.any(Defect.class_name == payload.defect_class))

    inspections = db.scalars(query.order_by(Inspection.captured_at.desc())).all()

    total_inspections = len(inspections)
    pass_count = sum(1 for i in inspections if i.status.value == "PASS")
    fail_count = sum(1 for i in inspections if i.status.value == "FAIL")
    yield_rate = round((pass_count / total_inspections) * 100, 2) if total_inspections > 0 else 100.0

    defects_count = sum(len(i.defects) for i in inspections)

    summary = {
        "report_type": payload.report_type,
        "total_inspections": total_inspections,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "yield_rate": yield_rate,
        "total_defects": defects_count,
        "date_from": payload.date_from.isoformat() if payload.date_from else None,
        "date_to": payload.date_to.isoformat() if payload.date_to else None,
    }

    # Generate CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Inspection ID", "Captured At", "Station", "Model", "AI Status", "Review Status",
        "Final Status", "Defect Count", "Defects Summary"
    ])
    for i in inspections:
        defect_str = "; ".join(f"{d.class_name}({d.severity.value}, {d.confidence:.2f})" for d in i.defects)
        writer.writerow([
            str(i.id),
            i.captured_at.isoformat(),
            i.station_id or "STATION-01",
            i.model,
            i.status.value,
            i.review_status,
            i.final_status.value if i.final_status else i.status.value,
            len(i.defects),
            defect_str,
        ])
    csv_content = output.getvalue()

    report_id = uuid.uuid4()
    report = Report(
        id=report_id,
        title=payload.title,
        report_type=payload.report_type,
        format=payload.format.upper(),
        status="COMPLETED",
        summary_json=summary,
        file_content=csv_content,
        file_url=f"/reports/{report_id}/download",
        created_by_id=current_user.id,
        created_by_email=current_user.email,
        created_at=datetime.now(timezone.utc),
    )
    db.add(report)

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="REPORT_GENERATED",
            entity="report",
            entity_id=str(report_id),
            description=f"Generated {payload.report_type} report '{payload.title}' ({payload.format.upper()})",
            details_json=summary,
        )
    )

    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}/download")
def download_report(
    report_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    report = db.get(Report, report_id)
    if not report or not report.file_content:
        raise HTTPException(status_code=404, detail="Report file not found")

    filename = f"{report.title.lower().replace(' ', '_')}_{report.created_at.strftime('%Y%m%d')}.csv"
    return Response(
        content=report.file_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
