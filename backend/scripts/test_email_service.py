"""Unit & Integration Tests for PCB Vision SMTP Email Service.

Tests:
1. Configuration loading and validation.
2. Credential safety (passwords never exposed).
3. Email message construction (HTML, plain-text fallback, MIME headers).
4. Defect alert formatting and workstation URL resolution.
5. Local mock SMTP server delivery (end-to-end SMTP protocol).
6. Failure handling and graceful error recovery.
7. FastAPI route status and validation checks.
"""

import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure backend directory is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.email import (
    get_email_service_status,
    get_registered_admin_emails,
    get_smtp_config,
    send_defect_email_alert,
    send_email,
    send_test_email,
    validate_smtp_configuration,
)



class TestSMTPEmailService(unittest.TestCase):

    def setUp(self):
        # Backup environment
        self._orig_env = dict(os.environ)

    def tearDown(self):
        # Restore environment
        os.environ.clear()
        os.environ.update(self._orig_env)

    def test_01_configuration_validation_missing_fields(self):
        """Verify configuration validator flags missing required fields."""
        os.environ["SMTP_USER"] = ""
        os.environ["SMTP_PASSWORD"] = ""
        os.environ["SMTP_FROM"] = ""

        is_valid, missing = validate_smtp_configuration()
        self.assertFalse(is_valid)
        self.assertIn("SMTP_USER", missing)
        self.assertIn("SMTP_PASSWORD", missing)

    def test_02_configuration_validation_complete(self):
        """Verify configuration validator passes when all fields are supplied."""
        os.environ["SMTP_HOST"] = "smtp.gmail.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "test.operator@gmail.com"
        os.environ["SMTP_PASSWORD"] = "abcd efgh ijkl mnop"
        os.environ["SMTP_FROM"] = "test.operator@gmail.com"

        is_valid, missing = validate_smtp_configuration()
        self.assertTrue(is_valid)
        self.assertEqual(len(missing), 0)

    def test_03_credential_safety_in_status(self):
        """Verify that password is NEVER exposed in service status."""
        secret_password = "super_secret_gmail_app_password"
        os.environ["SMTP_HOST"] = "smtp.gmail.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "engineer@example.com"
        os.environ["SMTP_PASSWORD"] = secret_password

        status = get_email_service_status()

        # Check that the secret password appears nowhere in keys or values
        status_str = str(status)
        self.assertNotIn(secret_password, status_str)
        self.assertNotIn("password", status)
        # Check user is masked
        self.assertIn("en***@example.com", status.get("user", ""))

    def test_04_skip_dispatch_when_unconfigured(self):
        """Verify send_email gracefully returns False without raising when unconfigured."""
        os.environ["SMTP_USER"] = ""
        os.environ["SMTP_PASSWORD"] = ""

        success = send_email(
            to_email="admin@example.com",
            subject="Test PCB Alert",
            html_content="<p>Test Content</p>",
        )
        self.assertFalse(success)

    @patch("smtplib.SMTP")
    def test_05_successful_smtp_dispatch(self, mock_smtp_class):
        """Verify end-to-end SMTP session creation, STARTTLS, login, and sendmail."""
        mock_server = MagicMock()
        mock_smtp_class.return_value = mock_server

        os.environ["SMTP_HOST"] = "smtp.gmail.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "operator@gmail.com"
        os.environ["SMTP_PASSWORD"] = "valid-app-password"
        os.environ["SMTP_FROM"] = "operator@gmail.com"
        os.environ["SMTP_USE_TLS"] = "true"

        success = send_email(
            to_email="admin@company.com",
            subject="Test Inspection Subject",
            html_content="<h1>PCB Test</h1>",
            text_content="PCB Test",
        )

        self.assertTrue(success)
        mock_smtp_class.assert_called_once_with(host="smtp.gmail.com", port=587, timeout=15)
        mock_server.ehlo.assert_called()
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("operator@gmail.com", "valid-app-password")
        mock_server.sendmail.assert_called_once()
        mock_server.quit.assert_called_once()

    @patch("smtplib.SMTP")
    def test_06_defect_alert_html_formatting(self, mock_smtp_class):
        """Verify send_defect_email_alert generates correct subject, defect rows, and link."""
        mock_server = MagicMock()
        mock_smtp_class.return_value = mock_server

        os.environ["SMTP_HOST"] = "smtp.gmail.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "station@gmail.com"
        os.environ["SMTP_PASSWORD"] = "valid-app-password"
        os.environ["SMTP_FROM"] = "station@gmail.com"

        defects = [
            {"class": "missing_hole", "severity": "critical", "confidence": 0.965},
            {"class": "short", "severity": "medium", "confidence": 0.884},
        ]

        success = send_defect_email_alert(
            inspection_id="12345678-abcd-ef01-2345-6789abcdef01",
            pcb_id="PCB-2026-X10",
            station_id="STATION-02",
            model="YOLOv8x-DeepPCB",
            status="FAIL",
            defect_count=2,
            operator_email="eng@pcb.com",
            defects=defects,
            recipient="admin@pcb.com",
        )

        self.assertTrue(success)
        # Inspect the message sent
        import email
        call_args = mock_server.sendmail.call_args
        sender, recipients, msg_str = call_args[0]
        self.assertEqual(sender, "station@gmail.com")
        self.assertIn("admin@pcb.com", recipients)
        
        from email.header import decode_header
        parsed_msg = email.message_from_string(msg_str)
        subject_parts = decode_header(parsed_msg.get("Subject"))
        decoded_subject = "".join(
            p[0].decode(p[1] or "utf-8") if isinstance(p[0], bytes) else p[0]
            for p in subject_parts
        )
        self.assertIn("PCB DEFECT ALERT", decoded_subject)

        # Extract and verify payload bodies
        plain_body = ""
        html_body = ""
        for part in parsed_msg.walk():
            ct = part.get_content_type()
            if ct == "text/plain":
                plain_body = part.get_payload(decode=True).decode("utf-8")
            elif ct == "text/html":
                html_body = part.get_payload(decode=True).decode("utf-8")

        self.assertIn("missing_hole", html_body.lower())
        self.assertIn("short", html_body.lower())
        self.assertIn("96.5%", html_body)
        self.assertIn("/inspections/12345678-abcd-ef01-2345-6789abcdef01", html_body)
        self.assertNotIn("via Resend", html_body)
        self.assertIn("Automated notification via SMTP", html_body)

        # Verify plain-text fallback content
        self.assertIn("missing_hole", plain_body.lower())
        self.assertIn("STATION-02", plain_body)

    @patch("smtplib.SMTP")
    def test_07_smtp_authentication_failure_handling(self, mock_smtp_class):
        """Verify authentication failure is caught, logged, and does not raise exception."""
        import smtplib
        mock_server = MagicMock()
        mock_server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Authentication failed")
        mock_smtp_class.return_value = mock_server

        os.environ["SMTP_HOST"] = "smtp.gmail.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "bad.user@gmail.com"
        os.environ["SMTP_PASSWORD"] = "bad-password"
        os.environ["SMTP_FROM"] = "bad.user@gmail.com"

        success = send_email(
            to_email="admin@company.com",
            subject="Test Subject",
            html_content="<p>Test</p>",
        )

        self.assertFalse(success)
        mock_server.quit.assert_called_once()

    def test_08_backward_compatibility_email_service_module(self):
        """Verify that app.email_service continues to export expected symbols."""
        import app.email_service as legacy_module

        self.assertTrue(hasattr(legacy_module, "send_defect_email_alert"))
        self.assertTrue(hasattr(legacy_module, "send_email"))
        self.assertTrue(hasattr(legacy_module, "send_test_email"))
        self.assertTrue(hasattr(legacy_module, "get_email_service_status"))

    def test_09_fastapi_email_status_route(self):
        """Verify GET /notifications/email endpoint returns correct status schema."""
        from starlette.testclient import TestClient
        from app.main import app

        client = TestClient(app)
        res = client.get("/notifications/email")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("smtp_configured", data)
        self.assertIn("from_email", data)
        self.assertIn("host", data)
        self.assertIn("port", data)
        self.assertIn("admin_recipients", data)

    @patch("smtplib.SMTP")
    def test_10_fastapi_test_email_dispatch_route(self, mock_smtp_class):
        """Verify POST /notifications/email with action='test' triggers test email."""
        from starlette.testclient import TestClient
        from app.main import app

        mock_server = MagicMock()
        mock_smtp_class.return_value = mock_server

        os.environ["SMTP_HOST"] = "smtp.gmail.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "admin@example.com"
        os.environ["SMTP_PASSWORD"] = "app-password"
        os.environ["SMTP_FROM"] = "admin@example.com"

        client = TestClient(app)
        res = client.post(
            "/notifications/email",
            json={"action": "test", "recipient": "tester@example.com"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        mock_server.sendmail.assert_called_once()

    def test_11_get_registered_admin_emails(self):
        """Verify get_registered_admin_emails returns active admin emails from db or config."""
        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = ["admin1@company.com", "admin2@company.com"]
        admins = get_registered_admin_emails(db=mock_db)
        self.assertIn("admin1@company.com", admins)
        self.assertIn("admin2@company.com", admins)

    @patch("smtplib.SMTP")
    def test_12_defect_alert_dispatched_to_all_registered_admins(self, mock_smtp_class):
        """Verify defect alerts automatically resolve and send to all registered admins."""
        mock_server = MagicMock()
        mock_smtp_class.return_value = mock_server

        os.environ["SMTP_HOST"] = "smtp.gmail.com"
        os.environ["SMTP_PORT"] = "587"
        os.environ["SMTP_USER"] = "station@gmail.com"
        os.environ["SMTP_PASSWORD"] = "valid-app-password"
        os.environ["SMTP_FROM"] = "station@gmail.com"

        mock_db = MagicMock()
        mock_db.scalars.return_value.all.return_value = ["admin_alpha@corp.org", "admin_beta@corp.org"]

        success = send_defect_email_alert(
            inspection_id="11111111-2222-3333-4444-555555555555",
            pcb_id="PCB-TEST-BOARD",
            station_id="STATION-01",
            model="YOLOv8x",
            status="FAIL",
            defect_count=1,
            operator_email="operator@corp.org",
            defects=[{"class": "mouse_bite", "severity": "critical", "confidence": 0.99}],
            recipient=None,
            db=mock_db,
        )

        self.assertTrue(success)
        mock_server.sendmail.assert_called_once()
        sender, recipients, msg_str = mock_server.sendmail.call_args[0]
        self.assertIn("admin_alpha@corp.org", recipients)
        self.assertIn("admin_beta@corp.org", recipients)


if __name__ == "__main__":
    unittest.main(verbosity=2)

