import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..auth import get_current_user, require_role
from ..db import get_db
from ..models import AuditLog, Inspection, InspectionStatus, Review, User, UserRole
from ..schemas import InspectionListItem, InspectionListResponse, ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=InspectionListResponse)
def list_review_queue(
    filter_status: Literal["PENDING", "COMPLETED", "ALL"] = Query("PENDING"),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin, UserRole.engineer)),
):
    query = select(Inspection)
    if filter_status == "PENDING":
        query = query.where(Inspection.review_status == "PENDING")
    elif filter_status == "COMPLETED":
        query = query.where(Inspection.review_status.in_(["CONFIRMED", "OVERRIDDEN"]))

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    inspections = db.scalars(
        query.options(selectinload(Inspection.defects))
        .order_by(Inspection.captured_at.desc())
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


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def submit_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin, UserRole.engineer)),
):
    inspection = db.scalar(
        select(Inspection).options(selectinload(Inspection.defects)).where(Inspection.id == payload.inspection_id)
    )
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    decision = payload.review_decision.upper()
    if decision not in {"CONFIRM", "OVERRIDE_PASS", "OVERRIDE_FAIL"}:
        raise HTTPException(
            status_code=422,
            detail="Invalid review_decision. Must be CONFIRM, OVERRIDE_PASS, or OVERRIDE_FAIL",
        )

    is_override = decision.startswith("OVERRIDE")
    if is_override and (not payload.justification or len(payload.justification.strip()) < 5):
        raise HTTPException(
            status_code=422,
            detail="Justification is strictly required when overriding an AI result (minimum 5 characters).",
        )

    if decision == "CONFIRM":
        final_result = inspection.status
        review_status_val = "CONFIRMED"
    elif decision == "OVERRIDE_PASS":
        final_result = InspectionStatus.PASS
        review_status_val = "OVERRIDDEN"
    else:
        final_result = InspectionStatus.FAIL
        review_status_val = "OVERRIDDEN"

    review = Review(
        inspection_id=inspection.id,
        automated_result=inspection.status,
        review_decision=decision,
        final_result=final_result,
        reviewer_id=current_user.id,
        reviewer_email=current_user.email,
        justification=payload.justification.strip(),
        notes=payload.notes.strip() if payload.notes else None,
        created_at=datetime.now(timezone.utc),
    )
    db.add(review)

    inspection.review_status = review_status_val
    inspection.final_status = final_result
    inspection.reviewed_by = current_user.email
    inspection.reviewed_at = datetime.now(timezone.utc)

    # Audit logging
    action = "INSPECTION_OVERRIDDEN" if is_override else "INSPECTION_REVIEWED"
    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action=action,
            entity="inspection",
            entity_id=str(inspection.id),
            description=(
                f"{current_user.email} {decision} result for inspection {inspection.id} "
                f"(AI: {inspection.status.value} -> Final: {final_result.value}). Justification: {payload.justification}"
            ),
            details_json={
                "decision": decision,
                "ai_result": inspection.status.value,
                "final_result": final_result.value,
                "justification": payload.justification,
            },
        )
    )

    db.commit()
    db.refresh(review)
    return review


@router.get("/{inspection_id}", response_model=list[ReviewResponse])
def get_inspection_reviews(
    inspection_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    reviews = db.scalars(
        select(Review).where(Review.inspection_id == inspection_id).order_by(Review.created_at.desc())
    ).all()
    return reviews
