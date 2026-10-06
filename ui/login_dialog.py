"""Station Login and Operator Authentication Dialog for PCB-Vision.
Validates credentials against registered users in Supabase with offline resilience.
Clean, modern light enterprise workstation theme.
"""
from pathlib import Path
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont, QPixmap, QPainter, QColor, QPen, QBrush
from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QFrame,
    QWidget,
)

from core.auth import authenticate_station_user, request_password_reset

# Locate official logo asset
_ASSETS_DIR = Path(__file__).resolve().parent / "assets"
_LOGO_FILE = _ASSETS_DIR / "logo.png"
if not _LOGO_FILE.exists():
    _FALLBACK_LOGO = Path(__file__).resolve().parent.parent / "web" / "public" / "logo.png"
    if _FALLBACK_LOGO.exists():
        _LOGO_FILE = _FALLBACK_LOGO


class BrandLogoWidget(QWidget):
    """Clean, high-DPI branded app emblem with dark contrast tile for white surfaces."""

    def __init__(self, size: int = 56, parent=None):
        super().__init__(parent)
        self.tile_size = size
        self.setFixedSize(size, size)
        self.pixmap = None
        if _LOGO_FILE.exists():
            orig = QPixmap(str(_LOGO_FILE))
            if not orig.isNull():
                inner_size = int(size * 0.88)
                self.pixmap = orig.scaled(
                    inner_size,
                    inner_size,
                    Qt.KeepAspectRatio,
                    Qt.SmoothTransformation,
                )

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        # Rounded dark slate tile for high logo contrast
        bg_col = QColor(15, 23, 42)
        border_col = QColor(203, 213, 225)
        painter.setBrush(QBrush(bg_col))
        painter.setPen(QPen(border_col, 1))
        radius = int(self.tile_size * 0.22)
        painter.drawRoundedRect(1, 1, self.tile_size - 2, self.tile_size - 2, radius, radius)

        # Draw logo pixmap centered
        if self.pixmap and not self.pixmap.isNull():
            px = (self.width() - self.pixmap.width()) // 2
            py = (self.height() - self.pixmap.height()) // 2
            painter.drawPixmap(px, py, self.pixmap)
        else:
            cyan_pen = QPen(QColor(56, 189, 248), 1.8)
            painter.setPen(cyan_pen)
            painter.setBrush(Qt.NoBrush)
            c = self.tile_size // 2
            r = int(self.tile_size * 0.2)
            painter.drawEllipse(c - r, c - r, r * 2, r * 2)
            painter.setBrush(QBrush(QColor(56, 189, 248)))
            painter.drawEllipse(c - 2, c - 2, 4, 4)


class LoginDialog(QDialog):
    """Operator authorization dialog for station access (Clean White Enterprise UI)."""

    def __init__(self, parent=None, prefill_email: str = ""):
        super().__init__(parent)
        self.setWindowTitle("Station Operator Sign-In — PCB Fault Detection")
        self.setFixedSize(450, 545)
        self.setModal(True)
        self.authenticated_user = None

        # Clean white enterprise styling
        self.setStyleSheet("""
            QDialog {
                background-color: #ffffff;
                color: #0f172a;
                font-family: "Segoe UI", Arial, sans-serif;
            }
            QLabel {
                color: #0f172a;
                font-family: "Segoe UI", Arial, sans-serif;
                border: none;
                background: transparent;
            }
            QLineEdit {
                background-color: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 10px 12px;
                color: #0f172a;
                font-size: 13px;
                font-family: "Segoe UI", Arial, sans-serif;
                selection-background-color: #2563eb;
                selection-color: #ffffff;
            }
            QLineEdit:hover {
                border: 1px solid #94a3b8;
                background-color: #ffffff;
            }
            QLineEdit:focus {
                border: 1.5px solid #2563eb;
                background-color: #ffffff;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(34, 28, 34, 26)
        layout.setSpacing(14)

        # ---- Header Section with Official Logo Tile ----
        header_layout = QHBoxLayout()
        header_layout.setSpacing(14)

        logo_widget = BrandLogoWidget(size=52)
        header_layout.addWidget(logo_widget)

        title_vbox = QVBoxLayout()
        title_vbox.setSpacing(2)

        app_title = QLabel("PCB Fault Detection")
        app_title.setStyleSheet("font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;")

        station_subtitle = QLabel("Automated Optical Inspection System")
        station_subtitle.setStyleSheet("font-size: 11px; font-weight: 500; color: #64748b;")

        title_vbox.addWidget(app_title)
        title_vbox.addWidget(station_subtitle)
        header_layout.addLayout(title_vbox, 1)

        # Station ID pill
        badge_station = QLabel("STATION 01")
        badge_station.setStyleSheet("""
            background-color: #f1f5f9;
            color: #0284c7;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            letter-spacing: 0.5px;
        """)
        badge_station.setAlignment(Qt.AlignCenter)
        header_layout.addWidget(badge_station)

        layout.addLayout(header_layout)

        # Subtle divider
        divider = QFrame()
        divider.setFrameShape(QFrame.HLine)
        divider.setStyleSheet("background-color: #e2e8f0; max-height: 1px; border: none;")
        layout.addWidget(divider)

        # Sub-header prompt
        prompt_lbl = QLabel("Enter operator credentials to unlock station inspection controls")
        prompt_lbl.setStyleSheet("font-size: 12px; color: #64748b; font-weight: 400;")
        layout.addWidget(prompt_lbl)

        # ---- Error Alert Callout (hidden by default) ----
        self.error_banner = QFrame()
        self.error_banner.setObjectName("errorBanner")
        self.error_banner.setStyleSheet("""
            QFrame#errorBanner {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 6px;
                padding: 4px 8px;
            }
        """)
        err_box = QHBoxLayout(self.error_banner)
        err_box.setContentsMargins(8, 4, 8, 4)
        err_box.setSpacing(8)

        err_icon = QLabel("⚠")
        err_icon.setFixedSize(18, 18)
        err_icon.setAlignment(Qt.AlignCenter)
        err_icon.setStyleSheet("color: #dc2626; font-size: 13px; font-weight: bold;")
        err_box.addWidget(err_icon)

        self.error_text = QLabel("")
        self.error_text.setWordWrap(True)
        self.error_text.setStyleSheet("color: #991b1b; font-size: 11px; font-weight: 500;")
        err_box.addWidget(self.error_text, 1)

        self.error_banner.hide()
        layout.addWidget(self.error_banner)

        # ---- Form Inputs ----
        form_layout = QVBoxLayout()
        form_layout.setSpacing(12)

        # Email field
        lbl_email = QLabel("Operator Email")
        lbl_email.setStyleSheet("font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.4px;")

        self.txt_email = QLineEdit()
        self.txt_email.setPlaceholderText("operator@company.com")
        self.txt_email.returnPressed.connect(self._focus_password)

        form_layout.addWidget(lbl_email)
        form_layout.addWidget(self.txt_email)

        # Password field with toggle
        lbl_pass_row = QHBoxLayout()
        lbl_pass = QLabel("Station Password")
        lbl_pass.setStyleSheet("font-size: 11px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.4px;")
        lbl_pass_row.addWidget(lbl_pass)
        lbl_pass_row.addStretch()

        self.btn_forgot = QPushButton("Forgot?")
        self.btn_forgot.setCursor(Qt.PointingHandCursor)
        self.btn_forgot.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: none;
                color: #2563eb;
                font-size: 11px;
                font-weight: 600;
                padding: 0px 4px;
            }
            QPushButton:hover {
                color: #1d4ed8;
                text-decoration: underline;
            }
        """)
        self.btn_forgot.clicked.connect(self._prompt_forgot_password)
        lbl_pass_row.addWidget(self.btn_forgot)

        self.lbl_caps = QLabel("Caps Lock is ON")
        self.lbl_caps.setStyleSheet("font-size: 10px; font-weight: 600; color: #d97706;")
        self.lbl_caps.hide()
        lbl_pass_row.addWidget(self.lbl_caps)

        # Password input container with show/hide button
        self.pass_wrapper = QFrame()
        self.pass_wrapper.setObjectName("passWrapper")
        self.pass_wrapper.setStyleSheet("""
            QFrame#passWrapper {
                background-color: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
            }
            QFrame#passWrapper:hover {
                border: 1px solid #94a3b8;
                background-color: #ffffff;
            }
        """)
        pass_box = QHBoxLayout(self.pass_wrapper)
        pass_box.setContentsMargins(10, 0, 6, 0)
        pass_box.setSpacing(4)

        self.txt_pass = QLineEdit()
        self.txt_pass.setEchoMode(QLineEdit.Password)
        self.txt_pass.setPlaceholderText("Enter station password")
        self.txt_pass.setStyleSheet("""
            QLineEdit {
                background: transparent;
                border: none;
                padding: 10px 0px;
                color: #0f172a;
                font-size: 13px;
            }
        """)
        self.txt_pass.returnPressed.connect(self.attempt_login)
        pass_box.addWidget(self.txt_pass, 1)

        self.btn_toggle_pass = QPushButton("Show")
        self.btn_toggle_pass.setCursor(Qt.PointingHandCursor)
        self.btn_toggle_pass.setFixedHeight(26)
        self.btn_toggle_pass.setStyleSheet("""
            QPushButton {
                background-color: #ffffff;
                color: #475569;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                padding: 2px 8px;
            }
            QPushButton:hover {
                color: #0f172a;
                background-color: #f1f5f9;
                border: 1px solid #94a3b8;
            }
        """)
        self.btn_toggle_pass.clicked.connect(self._toggle_password_visibility)
        pass_box.addWidget(self.btn_toggle_pass)

        form_layout.addLayout(lbl_pass_row)
        form_layout.addWidget(self.pass_wrapper)
        layout.addLayout(form_layout)

        # ---- Station Info Card (clean white enterprise) ----
        info_card = QFrame()
        info_card.setObjectName("infoCard")
        info_card.setStyleSheet("""
            QFrame#infoCard {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
            }
        """)
        info_vbox = QVBoxLayout(info_card)
        info_vbox.setContentsMargins(12, 10, 12, 10)
        info_vbox.setSpacing(3)

        row_status = QHBoxLayout()
        row_status.setSpacing(6)

        dot_status = QLabel("●")
        dot_status.setStyleSheet("color: #10b981; font-size: 11px;")
        lbl_status = QLabel("Station Node Online")
        lbl_status.setStyleSheet("font-size: 11px; font-weight: 600; color: #1e293b;")

        row_status.addWidget(dot_status)
        row_status.addWidget(lbl_status)
        row_status.addStretch()

        badge_role = QLabel("RBAC Protected")
        badge_role.setStyleSheet("""
            color: #0369a1;
            font-size: 10px;
            font-weight: 600;
            background-color: #e0f2fe;
            border: 1px solid #bae6fd;
            padding: 2px 6px;
            border-radius: 3px;
        """)
        row_status.addWidget(badge_role)
        info_vbox.addLayout(row_status)

        lbl_roles_note = QLabel("Authorized roles: Quality Engineer • Station Administrator")
        lbl_roles_note.setStyleSheet("font-size: 11px; color: #64748b;")
        info_vbox.addWidget(lbl_roles_note)

        layout.addWidget(info_card)

        # ---- Action Buttons ----
        layout.addStretch()

        btn_box = QHBoxLayout()
        btn_box.setSpacing(10)

        self.btn_cancel = QPushButton("Cancel")
        self.btn_cancel.setFixedHeight(38)
        self.btn_cancel.setFixedWidth(100)
        self.btn_cancel.setCursor(Qt.PointingHandCursor)
        self.btn_cancel.setStyleSheet("""
            QPushButton {
                background-color: #ffffff;
                color: #475569;
                font-size: 12px;
                font-weight: 600;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
            }
            QPushButton:hover {
                background-color: #f1f5f9;
                color: #0f172a;
                border: 1px solid #94a3b8;
            }
            QPushButton:pressed {
                background-color: #e2e8f0;
            }
        """)
        self.btn_cancel.clicked.connect(self.reject)

        self.btn_login = QPushButton("Unlock Workstation")
        self.btn_login.setFixedHeight(38)
        self.btn_login.setCursor(Qt.PointingHandCursor)
        self.btn_login.setStyleSheet("""
            QPushButton {
                background-color: #2563eb;
                color: #ffffff;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #1d4ed8;
                border-radius: 6px;
                letter-spacing: 0.2px;
            }
            QPushButton:hover {
                background-color: #1d4ed8;
                border: 1px solid #1e40af;
            }
            QPushButton:pressed {
                background-color: #1e40af;
            }
            QPushButton:disabled {
                background-color: #e2e8f0;
                color: #94a3b8;
                border: 1px solid #cbd5e1;
            }
        """)
        self.btn_login.clicked.connect(self.attempt_login)

        btn_box.addWidget(self.btn_cancel)
        btn_box.addWidget(self.btn_login, 1)
        layout.addLayout(btn_box)

    def _focus_password(self):
        self.txt_pass.setFocus()

    def _toggle_password_visibility(self):
        if self.txt_pass.echoMode() == QLineEdit.Password:
            self.txt_pass.setEchoMode(QLineEdit.Normal)
            self.btn_toggle_pass.setText("Hide")
        else:
            self.txt_pass.setEchoMode(QLineEdit.Password)
            self.btn_toggle_pass.setText("Show")

    def attempt_login(self):
        email = self.txt_email.text().strip()
        password = self.txt_pass.text()

        if not email or not password:
            self.show_error("Please provide both email address and password.")
            return

        self.error_banner.hide()
        self.btn_login.setEnabled(False)
        self.btn_login.setText("Authenticating...")

        try:
            user = authenticate_station_user(email, password)
            self.authenticated_user = user
            self.accept()
        except (ValueError, PermissionError) as e:
            self.show_error(str(e))
        except Exception as e:
            self.show_error(f"Authentication failed: {e}")
        finally:
            self.btn_login.setEnabled(True)
            self.btn_login.setText("Unlock Workstation")

    def show_error(self, message: str):
        self.error_text.setText(message)
        self.error_banner.show()

    def _prompt_forgot_password(self):
        email = self.txt_email.text().strip()
        if not email:
            self.show_error("Please enter your operator email address first to reset password.")
            self.txt_email.setFocus()
            return

        from PySide6.QtWidgets import QMessageBox
        reply = QMessageBox.question(
            self,
            "Reset Station Password",
            f"Send a Supabase password recovery link to:\n\n{email}\n\nDo you want to proceed?",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.Yes,
        )
        if reply != QMessageBox.Yes:
            return

        try:
            request_password_reset(email)
            QMessageBox.information(
                self,
                "Password Recovery Link Sent",
                f"A secure password reset link has been dispatched to {email} via Supabase Auth.\n\n"
                "Please follow the link in your email to choose a new strong password.",
            )
        except Exception as e:
            self.show_error(f"Failed to request reset: {e}")

