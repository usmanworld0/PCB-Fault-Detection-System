import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user
from ..db import get_db
from ..models import AuditLog, Defect, Inspection, InspectionStatus, Notification, Severity, User
from ..schemas import InspectionDetailResponse, InspectionListItem, InspectionListResponse
from ..storage import upload_file

router = APIRouter(prefix="/inspections", tags=["inspections"])


def _parse_result(value: str) -> dict:
    try:
        data = json.loads(value)
        if not isinstance(data, dict) or not isinstance(data.get("defects", []), list):
            raise ValueError
        if data.get("status") not in {"PASS", "FAIL"} or not isinstance(data.get("model"), str):
            raise ValueError
        return data
    except (json.JSONDecodeError, ValueError, TypeError):
        raise HTTPException(status_code=422, detail="result must be valid inspection JSON")


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
def ingest(
    captured_at: str = Form(...),
    source: str = Form(...),
    result: str = Form(...),
    image: UploadFile = File(...),
    annotated: UploadFile = File(...),
    station_id: str | None = Form(None),
    local_id: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payload = _parse_result(result)
    try:
        captured = datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail="captured_at must be ISO 8601")

    # --- Idempotency Check ---
    # Check if this exact inspection has already been uploaded from this station
    if local_id is not None and station_id:
        existing = db.scalar(
            select(Inspection).where(
                Inspection.local_id == local_id,
                Inspection.station_id == station_id,
            )
        )
        if existing:
            return {"id": str(existing.id), "status": "exists"}

    # Secondary check: same source and exact captured timestamp
    existing_by_source = db.scalar(
        select(Inspection).where(
            Inspection.source == source,
            Inspection.captured_at == captured,
        )
    )
    if existing_by_source:
        return {"id": str(existing_by_source.id), "status": "exists"}

    inspection_id = uuid.uuid4()
    try:
        image_url = upload_file(image, f"inspections/{inspection_id}.jpg")
        annotated_url = upload_file(annotated, f"inspections/{inspection_id}_annotated.jpg")

        has_critical = False
        defects_to_add = []
        for defect in payload["defects"]:
            box = defect.get("box")
            if not isinstance(box, list) or len(box) != 4:
                raise ValueError("Each defect needs a four-value box")
            sev = Severity(defect["severity"])
            if sev == Severity.Critical:
                has_critical = True
            defects_to_add.append(
                Defect(
                    inspection_id=inspection_id,
                    class_name=str(defect["class"]),
                    confidence=float(defect["confidence"]),
                    severity=sev,
                    box_x1=float(box[0]),
                    box_y1=float(box[1]),
                    box_x2=float(box[2]),
                    box_y2=float(box[3]),
                )
            )

        review_status = "PENDING" if (has_critical or payload["status"] == "FAIL") else "UNREVIEWED"

        inspection = Inspection(
            id=inspection_id,
            captured_at=captured,
            source=source,
            model=payload["model"],
            status=InspectionStatus(payload["status"]),
            image_url=image_url,
            annotated_url=annotated_url,
            station_id=station_id or "STATION-01",
            local_id=local_id,
            review_status=review_status,
        )
        db.add(inspection)
        for d in defects_to_add:
            db.add(d)

        # Automated notification on critical defect
        if has_critical:
            db.add(
                Notification(
                    category="Critical Defect",
                    title=f"Critical Defect on {source}",
                    message=f"Station {station_id or 'STATION-01'} detected critical defect(s) using model {payload['model']}.",
                    severity="Critical",
                    inspection_id=inspection_id,
                )
            )

        # Audit log for inspection creation
        db.add(
            AuditLog(
                user_id=current_user.id,
                user_email=current_user.email,
                action="INSPECTION_INGESTED",
                entity="inspection",
                entity_id=str(inspection_id),
                description=f"Ingested inspection {inspection_id} from {station_id or 'STATION-01'} ({source}) - Result: {payload['status']}",
                details_json={"model": payload["model"], "defects": len(defects_to_add), "has_critical": has_critical},
            )
        )

        db.commit()
    except (KeyError, TypeError, ValueError) as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=f"Invalid defect data: {exc}")
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not upload and store inspection: {exc}")

    return {"id": str(inspection_id), "status": "created"}


@router.get("", response_model=InspectionListResponse)
def list_inspections(
    status: InspectionStatus | None = None,
    model: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    defect_class: str | None = None,
    station_id: str | None = None,
    review_status: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not 1 <= limit <= 200 or offset < 0:
        raise HTTPException(status_code=422, detail="limit must be 1–200 and offset must not be negative")

    query = select(Inspection)
    if status:
        query = query.where(Inspection.status == status)
    if model:
        query = query.where(Inspection.model == model)
    if station_id:
        query = query.where(Inspection.station_id == station_id)
    if review_status:
        query = query.where(Inspection.review_status == review_status)
    if date_from:
        query = query.where(Inspection.captured_at >= date_from)
    if date_to:
        query = query.where(Inspection.captured_at <= date_to)
    if defect_class:
        query = query.where(Inspection.defects.any(Defect.class_name == defect_class))
    if search:
        search_term = f"%{search.strip()}%"
        query = query.where(
            or_(
                Inspection.source.ilike(search_term),
                Inspection.model.ilike(search_term),
                Inspection.station_id.ilike(search_term),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    inspections = db.scalars(
        query.options(selectinload(Inspection.defects))
        .order_by(Inspection.captured_at.desc(), Inspection.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return InspectionListResponse(
        total=total,
        items=[
            InspectionListItem(
                id=i.id,
                captured_at=i.captured_at,
                status=i.status,
                model=i.model,
                defect_count=len(i.defects),
                image_url=i.image_url,
                station_id=i.station_id,
                review_status=i.review_status,
                final_status=i.final_status,
            )
            for i in inspections
        ],
    )


@router.get("/{inspection_id}", response_model=InspectionDetailResponse)
def inspection_detail(
    inspection_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    inspection = db.scalar(
        select(Inspection)
        .options(selectinload(Inspection.defects), selectinload(Inspection.reviews))
        .where(Inspection.id == inspection_id)
    )
    if inspection is None:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection
