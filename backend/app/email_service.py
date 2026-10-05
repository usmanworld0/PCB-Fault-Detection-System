"""SMTP Email Notification Service for PCB Vision.

Delegates to reusable app.services.email module.
Preserves existing import paths and signatures across the repository.
"""

from .services.email import (
    get_email_service_status,
    get_registered_admin_emails,
    get_smtp_config,
    send_defect_email_alert,
    send_email,
    send_test_email,
    validate_smtp_configuration,
)

__all__ = [
    "send_defect_email_alert",
    "send_email",
    "send_test_email",
    "get_email_service_status",
    "get_registered_admin_emails",
    "validate_smtp_configuration",
    "get_smtp_config",
]

