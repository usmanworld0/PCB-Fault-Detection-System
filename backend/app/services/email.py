"""Reusable SMTP Email Notification Service for PCB Vision.

Replaces Resend with direct SMTP-based email dispatch using Python standard
libraries (smtplib, email.mime). Supports Gmail SMTP (with App Password),
STARTTLS, SSL, HTML templates, and plain-text fallbacks.
"""

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
import logging
import os
import smtplib
import socket
from typing import Any, Dict, List, Optional, Tuple, Union

logger = logging.getLogger("pcb_vision.email_service")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter("[%(asctime)s] [%(levelname)s] [SMTP Email] %(message)s")
    )
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def _get_env_or_config(key: str, default: Any = "") -> Any:
    """Retrieves configuration from backend settings or os.environ."""
    # 1. Check os.environ first
    val = os.environ.get(key)
    if val is not None and val != "":
        return val

    # 2. Check pydantic settings if available
    try:
        from ..config import get_settings

        settings = get_settings()
        attr_name = key.lower()
        if hasattr(settings, attr_name):
            attr_val = getattr(settings, attr_name)
            if attr_val is not None and attr_val != "":
                return attr_val
    except Exception:
        pass

    return default


def get_smtp_config() -> Dict[str, Any]:
    """Returns current SMTP configuration without sensitive secrets."""
    port_str = _get_env_or_config("SMTP_PORT", 587)
    try:
        port = int(port_str)
    except (ValueError, TypeError):
        port = 587

    timeout_str = _get_env_or_config("SMTP_TIMEOUT", 15)
    try:
        timeout = int(timeout_str)
    except (ValueError, TypeError):
        timeout = 15

    tls_str = str(_get_env_or_config("SMTP_USE_TLS", "true")).lower()
    use_tls = tls_str in ("1", "true", "yes")

    ssl_str = str(_get_env_or_config("SMTP_USE_SSL", "false")).lower()
    use_ssl = ssl_str in ("1", "true", "yes") or port == 465

    user = str(_get_env_or_config("SMTP_USER", "")).strip()
    password = str(_get_env_or_config("SMTP_PASSWORD", "")).strip().replace(" ", "")
    from_email = str(_get_env_or_config("SMTP_FROM", "")).strip() or user
    host = str(_get_env_or_config("SMTP_HOST", "smtp.gmail.com")).strip()
    admin_email = str(
        _get_env_or_config("ADMIN_NOTIFICATION_EMAIL", "world.usman.business@gmail.com")
    ).strip()
    app_base_url = str(
        _get_env_or_config("APP_BASE_URL", "https://pcb-fault-detection-system.vercel.app")
    ).strip()


    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from_email": from_email,
        "use_tls": use_tls,
        "use_ssl": use_ssl,
        "timeout": timeout,
        "admin_notification_email": admin_email,
        "app_base_url": app_base_url,
    }


def validate_smtp_configuration() -> Tuple[bool, List[str]]:
    """Validates that all required SMTP parameters are present."""
    cfg = get_smtp_config()
    missing: List[str] = []

    if not cfg["host"]:
        missing.append("SMTP_HOST")
    if not cfg["port"]:
        missing.append("SMTP_PORT")
    if not cfg["user"]:
        missing.append("SMTP_USER")
    if not cfg["password"]:
        missing.append("SMTP_PASSWORD")
    if not cfg["from_email"]:
        missing.append("SMTP_FROM")

    is_valid = len(missing) == 0
    return is_valid, missing


def get_registered_admin_emails(db: Optional[Any] = None) -> List[str]:
    """Retrieves all active registered admin email addresses from the database.
    Falls back to ADMIN_NOTIFICATION_EMAIL if no registered admins are found.
    """
    admin_emails: List[str] = []

    try:
        if db is not None:
            from ..models import User, UserRole
            from sqlalchemy import select

            rows = db.scalars(
                select(User.email).where(User.role == UserRole.admin, User.is_active.is_(True))
            ).all()
            for e in rows:
                if e and "@" in e:
                    norm = e.strip().lower()
                    if norm not in admin_emails:
                        admin_emails.append(norm)
        else:
            from ..db import SessionLocal
            from ..models import User, UserRole
            from sqlalchemy import select

            with SessionLocal() as session:
                rows = session.scalars(
                    select(User.email).where(User.role == UserRole.admin, User.is_active.is_(True))
                ).all()
                for e in rows:
                    if e and "@" in e:
                        norm = e.strip().lower()
                        if norm not in admin_emails:
                            admin_emails.append(norm)
    except Exception as exc:
        logger.warning("Could not query registered admin emails from database: %s", exc)

    cfg = get_smtp_config()
    fallback = cfg.get("admin_notification_email", "").strip().lower()
    if not admin_emails and fallback:
        admin_emails.append(fallback)
    elif fallback and fallback not in admin_emails and not fallback.endswith("@example.com"):
        admin_emails.append(fallback)

    return admin_emails


def get_email_service_status(db: Optional[Any] = None) -> Dict[str, Any]:
    """Returns safe operational status of the SMTP service (no credentials exposed)."""
    cfg = get_smtp_config()
    is_valid, missing = validate_smtp_configuration()
    admin_list = get_registered_admin_emails(db=db)

    masked_user = ""
    if cfg["user"] and "@" in cfg["user"]:
        local, domain = cfg["user"].split("@", 1)
        prefix = local[:2] if len(local) >= 2 else local
        masked_user = f"{prefix}***@{domain}"
    elif cfg["user"]:
        masked_user = f"{cfg['user'][:2]}***"

    return {
        "status": "configured" if is_valid else "unconfigured",
        "smtp_configured": is_valid,
        "host": cfg["host"],
        "port": cfg["port"],
        "user": masked_user,
        "from_email": cfg["from_email"],
        "use_tls": cfg["use_tls"],
        "use_ssl": cfg["use_ssl"],
        "missing_fields": missing,
        "primary_admin": cfg["admin_notification_email"],
        "admin_recipients": admin_list,
        "total_admins": len(admin_list),
    }



def send_email(
    to_email: Union[str, List[str]],
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    from_email: Optional[str] = None,
) -> bool:
    """Dispatches an email using Python smtplib with TLS/STARTTLS support.

    Args:
        to_email: Single recipient email string or list of recipient emails.
        subject: Email subject line.
        html_content: HTML body content.
        text_content: Plain-text fallback body.
        from_email: Optional custom sender address (defaults to SMTP_FROM/SMTP_USER).

    Returns:
        bool: True if email was sent successfully, False otherwise.
    """
    is_valid, missing = validate_smtp_configuration()
    if not is_valid:
        logger.warning(
            "SMTP email dispatch skipped: configuration incomplete. Missing: %s",
            ", ".join(missing),
        )
        return False

    cfg = get_smtp_config()
    sender = (from_email or cfg["from_email"]).strip()
    if not sender:
        logger.error("No valid sender email specified.")
        return False

    # Normalize recipient list
    if isinstance(to_email, str):
        recipients = [e.strip() for e in to_email.split(",") if e.strip()]
    else:
        recipients = [e.strip() for e in to_email if e and e.strip()]

    if not recipients:
        logger.error("No valid recipient addresses provided.")
        return False

    # Build MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(recipients)
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="pcb-vision.local")

    # Fallback plain text
    if text_content is None:
        text_content = (
            f"{subject}\n\n"
            "This is an automated notification from PCB Vision QA Platform.\n"
            "Please view this email in an HTML-compatible client."
        )

    part_text = MIMEText(text_content, "plain", "utf-8")
    part_html = MIMEText(html_content, "html", "utf-8")

    # According to RFC 2046, the last part is preferred
    msg.attach(part_text)
    msg.attach(part_html)

    server = None
    try:
        if cfg["use_ssl"]:
            server = smtplib.SMTP_SSL(
                host=cfg["host"],
                port=cfg["port"],
                timeout=cfg["timeout"],
            )
        else:
            server = smtplib.SMTP(
                host=cfg["host"],
                port=cfg["port"],
                timeout=cfg["timeout"],
            )

        server.ehlo()

        if cfg["use_tls"] and not cfg["use_ssl"]:
            server.starttls()
            server.ehlo()

        if cfg["user"] and cfg["password"]:
            server.login(cfg["user"], cfg["password"])

        server.sendmail(sender, recipients, msg.as_string())
        logger.info(
            "Email successfully sent to %s with subject: %s",
            ", ".join(recipients),
            subject,
        )
        return True

    except smtplib.SMTPAuthenticationError as auth_err:
        logger.error(
            "SMTP authentication failed for host %s:%s (code %s). Check SMTP_USER and App Password.",
            cfg["host"],
            cfg["port"],
            auth_err.smtp_code,
        )
        return False
    except smtplib.SMTPConnectError as conn_err:
        logger.error(
            "SMTP connection failed to %s:%s (code %s): %s",
            cfg["host"],
            cfg["port"],
            conn_err.smtp_code,
            conn_err.smtp_error,
        )
        return False
    except smtplib.SMTPRecipientsRefused as rec_err:
        logger.error("SMTP recipient(s) refused: %s", rec_err.recipients)
        return False
    except (socket.timeout, smtplib.SMTPServerDisconnected) as net_err:
        logger.error(
            "SMTP network timeout / disconnection while connecting to %s:%s - %s",
            cfg["host"],
            cfg["port"],
            net_err,
        )
        return False
    except smtplib.SMTPException as smtp_err:
        logger.error(
            "SMTP protocol exception during email delivery to %s: %s",
            ", ".join(recipients),
            smtp_err,
        )
        return False
    except Exception as exc:
        logger.error(
            "Unexpected error occurred during SMTP email dispatch: %s",
            exc,
        )
        return False
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                try:
                    server.close()
                except Exception:
                    pass


def send_defect_email_alert(
    inspection_id: str,
    pcb_id: Optional[str],
    station_id: Optional[str],
    model: str,
    status: str,
    defect_count: int,
    operator_email: Optional[str],
    defects: Optional[List[Dict[str, Any]]] = None,
    recipient: Optional[Union[str, List[str]]] = None,
    db: Optional[Any] = None,
) -> bool:
    """Dispatches a formatted inspection failure alert email to all registered admins via SMTP."""
    cfg = get_smtp_config()
    registered_admins = get_registered_admin_emails(db=db)

    # Determine recipient email list: broadcast to all registered admins plus any custom recipient
    if recipient:
        if isinstance(recipient, str):
            extra = [e.strip().lower() for e in recipient.split(",") if e.strip() and "@" in e]
        else:
            extra = [e.strip().lower() for e in recipient if e and "@" in str(e)]
        target_emails = list(dict.fromkeys(registered_admins + extra)) if registered_admins else extra
    else:
        target_emails = registered_admins if registered_admins else [cfg["admin_notification_email"]]

    workstation_url = f"{cfg['app_base_url'].rstrip('/')}/inspections/{inspection_id}"
    pcb_tag = f"PCB {pcb_id}" if pcb_id else f"UID #{str(inspection_id)[:8]}"
    subject = f"🚨 [PCB DEFECT ALERT] Board FAILED: {pcb_tag} ({defect_count} flaw{'s' if defect_count != 1 else ''})"

    # Generate defect rows HTML
    defect_rows_html = ""
    defect_rows_text = ""
    if defects:
        for idx, d in enumerate(defects[:8], 1):
            cls_name = d.get("class") or d.get("class_name") or "Defect"
            sev = d.get("severity") or "Detected"
            conf = d.get("confidence", 0.0)
            is_crit = str(sev).lower() == "critical"
            bg = "#FFF5F5" if is_crit else "#FFF8E6"
            color = "#E53E3E" if is_crit else "#D69E2E"
            border = "#FED7D7" if is_crit else "#FEEBC8"
            conf_str = (
                f"{conf * 100:.1f}%"
                if isinstance(conf, (int, float)) and conf <= 1
                else f"{conf}%"
            )

            defect_rows_text += f" - #{idx} {cls_name} [{sev}] ({conf_str})\n"

            defect_rows_html += f"""
            <tr style="border-bottom: 1px solid #E2E8F0;">
              <td style="padding: 8px 12px; font-size: 13px; color: #2D3748; font-weight: 600;">#{idx}</td>
              <td style="padding: 8px 12px; font-size: 13px; color: #2D3748; font-weight: bold; text-transform: uppercase;">{cls_name}</td>
              <td style="padding: 8px 12px;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; background: {bg}; color: {color}; border: 1px solid {border};">
                  {sev}
                </span>
              </td>
              <td style="padding: 8px 12px; font-size: 13px; color: #319795; font-weight: bold;">{conf_str}</td>
            </tr>
            """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 32px 16px; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2D3748;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
              <tr>
                <td style="background: #1A202C; padding: 24px 32px; border-bottom: 3px solid #E53E3E;">
                  <div style="font-size: 11px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #4FD1C5;">
                    PCB Vision Automated Optical QA
                  </div>
                  <h1 style="margin: 6px 0 0 0; font-size: 20px; font-weight: bold; color: #FFFFFF;">
                    🚨 Inspection Failure Detected
                  </h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 24px 32px 16px 32px;">
                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4A5568;">
                    An automated vision optical inspection has detected defective board anomalies. The board was classified with disposition <strong style="color: #E53E3E;">FAIL</strong>.
                  </p>
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0 20px 0; border: 1px solid #EDF2F7; border-radius: 12px; background: #F8F9FA;">
                    <tr>
                      <td style="padding: 12px 16px; border-right: 1px solid #EDF2F7; border-bottom: 1px solid #EDF2F7;" width="50%">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0;">PCB ID</div>
                        <div style="font-size: 14px; font-weight: bold; color: #2D3748; margin-top: 2px;">{pcb_id or 'Unassigned'}</div>
                      </td>
                      <td style="padding: 12px 16px; border-bottom: 1px solid #EDF2F7;" width="50%">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0;">Station ID</div>
                        <div style="font-size: 14px; font-weight: bold; color: #2D3748; margin-top: 2px;">{station_id or 'STATION-01'}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 16px; border-right: 1px solid #EDF2F7;" width="50%">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0;">AI Model</div>
                        <div style="font-size: 13px; font-weight: bold; color: #4FD1C5; margin-top: 2px;">{model}</div>
                      </td>
                      <td style="padding: 12px 16px;" width="50%">
                        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #A0AEC0;">Total Defects</div>
                        <div style="font-size: 14px; font-weight: bold; color: #E53E3E; margin-top: 2px;">{defect_count} Defect(s)</div>
                      </td>
                    </tr>
                  </table>
                  {"<table width='100%' cellspacing='0' cellpadding='0' border='0' style='border-collapse: collapse; border: 1px solid #E2E8F0; margin-bottom: 20px;'><thead><tr style='background: #EDF2F7;'><th style='padding: 8px 12px; font-size: 10px; text-align: left;'>#</th><th style='padding: 8px 12px; font-size: 10px; text-align: left;'>Category</th><th style='padding: 8px 12px; font-size: 10px; text-align: left;'>Severity</th><th style='padding: 8px 12px; font-size: 10px; text-align: left;'>Confidence</th></tr></thead><tbody>" + defect_rows_html + "</tbody></table>" if defect_rows_html else ""}
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 0 32px 32px 32px;">
                  <a href="{workstation_url}" target="_blank" style="display: inline-block; background-color: #4FD1C5; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 12px;">
                    Open In Inspection Workstation &rarr;
                  </a>
                  <div style="margin-top: 12px; font-size: 11px; color: #A0AEC0;">
                    UID: {inspection_id} &bull; Operator: {operator_email or 'System'}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background: #F8F9FA; padding: 16px 32px; border-top: 1px solid #EDF2F7; text-align: center; font-size: 11px; color: #A0AEC0;">
                  Automated notification via SMTP &bull; PCB Vision Automated Optical QA
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    plain_text = f"""
    [PCB DEFECT ALERT] Board FAILED: {pcb_tag}
    Status: {status}
    Defects: {defect_count}
    Station ID: {station_id or 'STATION-01'}
    AI Model: {model}
    Operator: {operator_email or 'System'}

    Detected Flaws:
    {defect_rows_text if defect_rows_text else 'None'}

    Inspection link: {workstation_url}
    """

    return send_email(
        to_email=target_emails,
        subject=subject,
        html_content=html,
        text_content=plain_text.strip(),
    )


def send_test_email(
    to_email: Optional[Union[str, List[str]]] = None,
    db: Optional[Any] = None,
) -> Tuple[bool, str]:
    """Dispatches a test notification email to verify SMTP server connectivity across registered admins."""
    cfg = get_smtp_config()
    registered_admins = get_registered_admin_emails(db=db)

    if to_email:
        if isinstance(to_email, str):
            extra = [e.strip().lower() for e in to_email.split(",") if e.strip() and "@" in e]
        else:
            extra = [e.strip().lower() for e in to_email if e and "@" in str(e)]
        recipients = list(dict.fromkeys(registered_admins + extra)) if registered_admins else extra
    else:
        recipients = registered_admins if registered_admins else [cfg["admin_notification_email"]]

    if not recipients:
        return False, "No valid recipient email addresses specified."

    subject = "🔔 [TEST] PCB Vision SMTP Email Notifications Connected"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #2D3748; background-color: #F8F9FA; margin: 0;">
      <div style="max-width: 540px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 14px; background: #FFFFFF; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
          <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: #4FD1C5;"></span>
          <h2 style="margin: 0; font-size: 18px; color: #2D3748;">PCB Vision Admin Notifications Test</h2>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #4A5568;">
          Congratulations! Your <strong>SMTP Email Notification Service</strong> is connected and functioning properly on PCB Vision platform.
        </p>
        <div style="background: #F8F9FA; padding: 14px 18px; border-radius: 10px; border: 1px solid #EDF2F7; margin: 18px 0; font-size: 12px; line-height: 1.8;">
          <strong>SMTP Server:</strong> {cfg['host']}:{cfg['port']}<br>
          <strong>Security:</strong> {"STARTTLS" if cfg['use_tls'] else ("SSL" if cfg['use_ssl'] else "Plain")}<br>
          <strong>From Sender:</strong> {cfg['from_email']}<br>
          <strong>Recipients ({len(recipients)}):</strong> {", ".join(recipients)}<br>
          <strong>Trigger Mode:</strong> Inspection Failures (Defective Boards)
        </div>
        <p style="font-size: 12px; color: #A0AEC0; margin-top: 16px;">
          Automated email alerts will be dispatched to this address whenever an optical board scan fails.
        </p>
      </div>
    </body>
    </html>
    """

    plain = (
        f"PCB Vision Admin Notifications Test\n\n"
        f"Congratulations! Your SMTP Email Notification Service is connected and functioning properly.\n"
        f"SMTP Server: {cfg['host']}:{cfg['port']}\n"
        f"From Sender: {cfg['from_email']}\n"
        f"Recipients: {', '.join(recipients)}\n"
    )

    success = send_email(
        to_email=recipients,
        subject=subject,
        html_content=html,
        text_content=plain,
    )

    if success:
        return True, f"Test email successfully dispatched to {', '.join(recipients)} via SMTP ({cfg['host']}:{cfg['port']})"
    else:
        is_valid, missing = validate_smtp_configuration()
        if not is_valid:
            return False, f"SMTP configuration incomplete. Missing required variables: {', '.join(missing)}"
        return False, f"Failed to deliver email through SMTP server {cfg['host']}:{cfg['port']}. Please check your credentials or network connection."
