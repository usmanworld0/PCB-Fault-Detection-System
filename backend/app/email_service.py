"""Resend Email Notification Service for PCB Vision.
Sends automated defect alert emails to admin when inspections fail or critical flaws are flagged.
"""

import os
import requests
from typing import List, Optional, Dict, Any

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
ADMIN_EMAIL = os.getenv("ADMIN_NOTIFICATION_EMAIL", "world.usman.business@gmail.com")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:3000")


def send_defect_email_alert(
    inspection_id: str,
    pcb_id: Optional[str],
    station_id: Optional[str],
    model: str,
    status: str,
    defect_count: int,
    operator_email: Optional[str],
    defects: Optional[List[Dict[str, Any]]] = None,
    recipient: Optional[str] = None,
) -> bool:
    """Dispatches a formatted inspection failure alert email to admin via Resend."""
    if not RESEND_API_KEY:
        print("[Resend] No RESEND_API_KEY configured. Skipping email dispatch.")
        return False

    target_email = recipient or ADMIN_EMAIL
    workstation_url = f"{APP_BASE_URL.rstrip('/')}/inspections/{inspection_id}"
    pcb_tag = f"PCB {pcb_id}" if pcb_id else f"UID #{str(inspection_id)[:8]}"
    subject = f"🚨 [PCB DEFECT ALERT] Board FAILED: {pcb_tag} ({defect_count} flaw{'s' if defect_count != 1 else ''})"

    # Generate defect rows HTML
    defect_rows_html = ""
    if defects:
        for idx, d in enumerate(defects[:8], 1):
            cls_name = d.get("class") or d.get("class_name") or "Defect"
            sev = d.get("severity") or "Detected"
            conf = d.get("confidence", 0.0)
            is_crit = str(sev).lower() == "critical"
            bg = "#FFF5F5" if is_crit else "#FFF8E6"
            color = "#E53E3E" if is_crit else "#D69E2E"
            border = "#FED7D7" if is_crit else "#FEEBC8"
            conf_str = f"{conf * 100:.1f}%" if isinstance(conf, (int, float)) and conf <= 1 else f"{conf}%"

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
                  <a href="{workstationUrl}" target="_blank" style="display: inline-block; background-color: #4FD1C5; color: #FFFFFF; font-size: 13px; font-weight: bold; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 12px;">
                    Open In Inspection Workstation &rarr;
                  </a>
                  <div style="margin-top: 12px; font-size: 11px; color: #A0AEC0;">
                    UID: {inspection_id} &bull; Operator: {operator_email or 'System'}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background: #F8F9FA; padding: 16px 32px; border-top: 1px solid #EDF2F7; text-align: center; font-size: 11px; color: #A0AEC0;">
                  Automated security notification via Resend &bull; PCB Vision Automated Optical QA
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    payload = {
        "from": RESEND_FROM,
        "to": [target_email],
        "subject": subject,
        "html": html,
    }

    try:
        res = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        if res.status_code in (200, 201):
            print(f"[Resend] Defect alert successfully sent to {target_email} (ID: {res.json().get('id')})")
            return True
        else:
            print(f"[Resend] Failed to send email: {res.status_code} - {res.text}")
            return False
    except Exception as exc:
        print(f"[Resend] Exception sending email alert: {exc}")
        return False
