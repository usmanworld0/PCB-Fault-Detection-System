import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Notification, User, UserRole
from ..schemas import NotificationListResponse, NotificationResponse
from ..services.email import (
    get_email_service_status,
    get_registered_admin_emails,
    get_smtp_config,
    send_defect_email_alert,
    send_email,
    send_test_email,
    validate_smtp_configuration,
)


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


@router.get("/email")
def get_email_status(db: Session = Depends(get_db)):
    """Returns safe operational status of the SMTP service and active admin recipients."""
    status_info = get_email_service_status(db=db)
    recipients = status_info.get("admin_recipients") or []
    return {
        "status": "ok",
        "smtp_configured": status_info["smtp_configured"],
        "from_email": status_info["from_email"],
        "host": status_info["host"],
        "port": status_info["port"],
        "admin_recipients": recipients,
        "total_admins": len(recipients),
        "primary_admin": recipients[0] if recipients else status_info.get("primary_admin"),
        "missing_fields": status_info["missing_fields"],
    }


@router.post("/email")
def send_email_notification(
    payload: dict,
    db: Session = Depends(get_db),
):
    """Dispatches test email or manual inspection defect alerts via SMTP service to all registered admins."""
    action = payload.get("action", "inspection_failed")

    # Fetch all registered admin emails from database
    admin_users = get_registered_admin_emails(db=db)
    recipients = list(admin_users)

    requested_recipient = payload.get("recipient")
    if requested_recipient and isinstance(requested_recipient, str) and requested_recipient.strip():
        for r in requested_recipient.split(","):
            r_clean = r.strip().lower()
            if r_clean and "@" in r_clean and r_clean not in recipients:
                recipients.append(r_clean)

    if not recipients:
        raise HTTPException(
            status_code=400,
            detail="No active admin accounts found in the system.",
        )

    is_configured, missing = validate_smtp_configuration()
    if not is_configured:
        raise HTTPException(
            status_code=503,
            detail=f"SMTP server is not configured. Missing variables: {', '.join(missing)}",
        )

    if action == "test":
        success, message = send_test_email(to_email=recipients, db=db)
        if not success:
            raise HTTPException(status_code=500, detail=message)
        return {
            "success": True,
            "message": f"Test email dispatched to ({', '.join(recipients)}) via SMTP",
            "recipients": recipients,
        }

    if action == "user_verification":
        target = payload.get("recipient")
        action_link = payload.get("action_link")
        role_name = str(payload.get("role", "engineer")).upper()
        if not target or not action_link:
            raise HTTPException(status_code=400, detail="Missing recipient or action_link for user verification")

        subject = "✉️ [PCB Vision] Verify Your Email Address & Activate Account"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #2D3748; background-color: #F8F9FA; margin: 0;">
          <div style="max-width: 540px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 14px; background: #FFFFFF; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <div style="font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #4FD1C5; margin-bottom: 8px;">
              PCB Vision QA Platform
            </div>
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: bold; color: #2D3748;">
              Verify Your Email Address
            </h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4A5568;">
              An administrator has added your account (<strong>{target}</strong>) to the PCB Vision platform with the role <strong>{role_name}</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #4A5568;">
              Please click the button below to verify your email address, configure your password, and activate your account access:
            </p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="{action_link}" target="_blank" style="display: inline-block; background-color: #4FD1C5; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79,209,197,0.35);">
                Verify Email &amp; Activate Account &rarr;
              </a>
            </div>
            <p style="font-size: 12px; color: #A0AEC0; margin-top: 20px; line-height: 1.5;">
              If the button does not work, copy and paste this verification URL into your browser:<br>
              <a href="{action_link}" style="color: #4FD1C5; word-break: break-all;">{action_link}</a>
            </p>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #EDF2F7; font-size: 11px; color: #A0AEC0; text-align: center;">
              This verification link will expire in 24 hours. If you did not expect this invitation, please ignore this email.
            </div>
          </div>
        </body>
        </html>
        """
        plain = (
            f"PCB Vision QA Platform - Verify Your Email Address\n\n"
            f"An administrator has created an account for {target} with role {role_name}.\n"
            f"Click the link below to verify your email and activate your account:\n\n"
            f"{action_link}\n\n"
            f"This link expires in 24 hours."
        )
        success = send_email(to_email=target, subject=subject, html_content=html, text_content=plain)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to dispatch verification email via SMTP")
        return {
            "success": True,
            "message": f"Verification email dispatched to {target} via SMTP",
            "recipients": [target],
        }

    # action == "inspection_failed"
    insp = payload.get("inspection")
    if not insp or not insp.get("id"):
        raise HTTPException(status_code=400, detail="Missing inspection payload with id")


    is_defective = (
        insp.get("status") == "FAIL" or bool(insp.get("defects") and len(insp.get("defects")) > 0)
    )
    if not is_defective:
        return {
            "skipped": True,
            "message": "Inspection passed without defects. No alert needed.",
        }

    success = send_defect_email_alert(
        inspection_id=str(insp.get("id")),
        pcb_id=insp.get("pcb_id"),
        station_id=insp.get("station_id"),
        model=insp.get("model", "Default YOLOv8"),
        status=insp.get("status", "FAIL"),
        defect_count=len(insp.get("defects") or []),
        operator_email=insp.get("operator_email"),
        defects=insp.get("defects"),
        recipient=recipients,
        db=db,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch defect alert via SMTP")

    return {
        "success": True,
        "message": f"Defect notification dispatched to admins ({', '.join(recipients)}) via SMTP",
        "recipients": recipients,
    }


