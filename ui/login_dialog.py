"""Station Login and Operator Authentication Dialog for PCB-Vision.
Validates credentials against registered users in Supabase.
"""
from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QFrame,
    QMessageBox,
)

from core.auth import authenticate_station_user, get_active_session


class LoginDialog(QDialog):
    """Operator authorization dialog for station access."""

    def __init__(self, parent=None, prefill_email: str = ""):
        super().__init__(parent)
        self.setWindowTitle("Station Operator Authorization")
        self.setFixedSize(460, 470)
        self.setModal(True)
        self.authenticated_user = None

        self.setStyleSheet("""
            QDialog {
                background-color: #0f172a;
                color: #f8fafc;
                border: 1px solid #334155;
                border-radius: 8px;
            }
            QLabel {
                color: #e2e8f0;
            }
            QLineEdit {
                background-color: #1e293b;
                border: 1px solid #475569;
                border-radius: 4px;
                padding: 8px 10px;
                color: #ffffff;
                font-size: 12px;
                font-family: monospace;
            }
            QLineEdit:focus {
                border: 1px solid #0284c7;
                background-color: #0f172a;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 28, 28, 28)
        layout.setSpacing(14)

        # Header
        header_box = QVBoxLayout()
        header_box.setSpacing(3)
        lbl_badge = QLabel("AOI STATION ACCESS CONTROL")
        lbl_badge.setStyleSheet("""
            font-size: 10px;
            font-family: monospace;
            font-weight: bold;
            color: #38bdf8;
            background-color: #0369a133;
            border: 1px solid #0284c755;
            border-radius: 3px;
            padding: 2px 6px;
            max-width: 190px;
        """)
        lbl_title = QLabel("Operator Sign-In")
        lbl_title.setStyleSheet("font-size: 18px; font-weight: bold; color: #ffffff;")
        lbl_sub = QLabel("Only registered users saved in Supabase can access this station.")
        lbl_sub.setStyleSheet("font-size: 11px; color: #94a3b8;")
        header_box.addWidget(lbl_badge)
        header_box.addWidget(lbl_title)
        header_box.addWidget(lbl_sub)
        layout.addLayout(header_box)

        # Divider
        divider = QFrame()
        divider.setFrameShape(QFrame.HLine)
        divider.setStyleSheet("background-color: #334155; max-height: 1px;")
        layout.addWidget(divider)

        # Error notification banner (hidden by default)
        self.error_banner = QLabel("")
        self.error_banner.setWordWrap(True)
        self.error_banner.setStyleSheet("""
            background-color: #7f1d1d44;
            color: #fca5a5;
            border: 1px solid #ef444455;
            border-radius: 4px;
            padding: 8px 10px;
            font-size: 11px;
            font-weight: 500;
        """)
        self.error_banner.hide()
        layout.addWidget(self.error_banner)

        # Input fields
        form_layout = QVBoxLayout()
        form_layout.setSpacing(10)

        lbl_email = QLabel("OPERATOR EMAIL")
        lbl_email.setStyleSheet("font-size: 10px; font-weight: bold; color: #94a3b8; font-family: monospace;")
        self.txt_email = QLineEdit()
        self.txt_email.setPlaceholderText("e.g. engineer@example.com")
        if prefill_email:
            self.txt_email.setText(prefill_email)
        else:
            cached = get_active_session()
            if cached and cached.get("email"):
                self.txt_email.setText(cached["email"])

        lbl_pass = QLabel("STATION PASSWORD")
        lbl_pass.setStyleSheet("font-size: 10px; font-weight: bold; color: #94a3b8; font-family: monospace;")
        self.txt_pass = QLineEdit()
        self.txt_pass.setEchoMode(QLineEdit.Password)
        self.txt_pass.setPlaceholderText("••••••••")
        self.txt_pass.returnPressed.connect(self.attempt_login)

        form_layout.addWidget(lbl_email)
        form_layout.addWidget(self.txt_email)
        form_layout.addWidget(lbl_pass)
        form_layout.addWidget(self.txt_pass)
        layout.addLayout(form_layout)

        # Role info card
        role_card = QFrame()
        role_card.setStyleSheet("background-color: #1e293b66; border: 1px solid #334155; border-radius: 4px; padding: 6px;")
        role_vbox = QVBoxLayout(role_card)
        role_vbox.setSpacing(3)
        role_lbl = QLabel("Role-Based Privileges:")
        role_lbl.setStyleSheet("font-size: 10px; font-weight: bold; color: #cbd5e1;")
        r1 = QLabel("• Quality Engineer: AOI inspection, save boards & sync to DB")
        r1.setStyleSheet("font-size: 10px; color: #94a3b8;")
        r2 = QLabel("• Admin: Full access + model sync and user administration")
        r2.setStyleSheet("font-size: 10px; color: #94a3b8;")
        r3 = QLabel("• Viewer: Read-only real-time camera inspection feed")
        r3.setStyleSheet("font-size: 10px; color: #94a3b8;")
        role_vbox.addWidget(role_lbl)
        role_vbox.addWidget(r1)
        role_vbox.addWidget(r2)
        role_vbox.addWidget(r3)
        layout.addWidget(role_card)

        # Buttons
        layout.addStretch()
        btn_box = QHBoxLayout()
        btn_box.setSpacing(8)

        self.btn_cancel = QPushButton("Exit Station")
        self.btn_cancel.setFixedSize(110, 36)
        self.btn_cancel.setCursor(Qt.PointingHandCursor)
        self.btn_cancel.setStyleSheet("""
            QPushButton {
                background-color: #1e293b;
                color: #cbd5e1;
                font-size: 11px;
                font-weight: 600;
                border: 1px solid #475569;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #334155;
            }
        """)
        self.btn_cancel.clicked.connect(self.reject)

        self.btn_login = QPushButton("Authorize Station")
        self.btn_login.setFixedHeight(36)
        self.btn_login.setCursor(Qt.PointingHandCursor)
        self.btn_login.setStyleSheet("""
            QPushButton {
                background-color: #0284c7;
                color: #ffffff;
                font-size: 12px;
                font-weight: bold;
                border: 1px solid #0369a1;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #0369a1;
            }
            QPushButton:pressed {
                background-color: #075985;
            }
        """)
        self.btn_login.clicked.connect(self.attempt_login)

        btn_box.addWidget(self.btn_cancel)
        btn_box.addWidget(self.btn_login, 1)
        layout.addLayout(btn_box)

    def attempt_login(self):
        email = self.txt_email.text().strip()
        password = self.txt_pass.text()

        if not email or not password:
            self.show_error("Please enter both email address and password.")
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
            self.show_error(f"Authentication error: {e}")
        finally:
            self.btn_login.setEnabled(True)
            self.btn_login.setText("Authorize Station")

    def show_error(self, message: str):
        self.error_banner.setText(message)
        self.error_banner.show()
