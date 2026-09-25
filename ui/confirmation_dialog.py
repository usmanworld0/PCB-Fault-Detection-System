"""Industrial Confirmation and Toast Popups for PCB-Vision Inspection Station.
Displays detailed visual confirmation when inspection runs are pushed to Supabase Database.
"""
from datetime import datetime
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QFrame,
    QGraphicsDropShadowEffect,
)


class SyncConfirmationDialog(QDialog):
    """Clean, high-contrast industrial modal confirmation showing ingestion and sync telemetry."""

    def __init__(
        self,
        parent=None,
        local_id: int | None = None,
        cloud_id: str | None = None,
        source: str = "",
        model: str = "",
        status: str = "PASS",
        defects_count: int = 0,
        operator_email: str = "",
        operator_role: str = "",
        synced: bool = True,
        msg: str = "",
    ):
        super().__init__(parent)
        self.setWindowTitle("Database Sync Confirmation")
        self.setFixedSize(520, 390)
        self.setModal(True)
        self.setStyleSheet("""
            QDialog {
                background-color: #111827;
                color: #f9fafb;
                border: 1px solid #374151;
                border-radius: 8px;
            }
            QLabel {
                color: #e5e7eb;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(14)

        # Header with status banner
        header_layout = QHBoxLayout()
        header_layout.setSpacing(12)

        icon_label = QLabel()
        icon_label.setFixedSize(38, 38)
        icon_label.setAlignment(Qt.AlignCenter)
        is_pass = status.upper() == "PASS"

        if synced:
            icon_text = "✓"
            icon_bg = "#065f46" if is_pass else "#7f1d1d"
            icon_color = "#34d399" if is_pass else "#f87171"
            title_text = "Inspection Pushed & Synced to Database"
            subtitle_text = "Records synchronized to Supabase Cloud Database & Storage"
        else:
            icon_text = "💾"
            icon_bg = "#1e293b"
            icon_color = "#38bdf8"
            title_text = "Inspection Saved to Local Station Database"
            subtitle_text = msg or "Saved locally in SQLite queue (offline mode)"

        icon_label.setText(icon_text)
        icon_label.setStyleSheet(f"""
            background-color: {icon_bg};
            color: {icon_color};
            font-size: 20px;
            font-weight: bold;
            border-radius: 19px;
            border: 1px solid {icon_color}44;
        """)
        header_layout.addWidget(icon_label)

        title_vbox = QVBoxLayout()
        title_vbox.setSpacing(2)
        lbl_title = QLabel(title_text)
        lbl_title.setStyleSheet("font-size: 15px; font-weight: bold; color: #ffffff;")
        lbl_sub = QLabel(subtitle_text)
        lbl_sub.setStyleSheet("font-size: 11px; color: #9ca3af;")
        title_vbox.addWidget(lbl_title)
        title_vbox.addWidget(lbl_sub)
        header_layout.addLayout(title_vbox, 1)

        layout.addLayout(header_layout)

        # Divider
        divider = QFrame()
        divider.setFrameShape(QFrame.HLine)
        divider.setStyleSheet("background-color: #374151; max-height: 1px;")
        layout.addWidget(divider)

        # Telemetry Card
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #1f2937;
                border: 1px solid #374151;
                border-radius: 6px;
                padding: 10px;
            }
        """)
        card_layout = QVBoxLayout(card)
        card_layout.setSpacing(8)

        def add_row(lbl_name: str, val_text: str, highlight_color: str | None = None, is_badge: bool = False):
            row = QHBoxLayout()
            name_widget = QLabel(lbl_name)
            name_widget.setStyleSheet("font-size: 11px; color: #9ca3af; font-weight: 500;")
            row.addWidget(name_widget)
            row.addStretch()

            val_widget = QLabel(val_text)
            if is_badge:
                val_widget.setStyleSheet(f"""
                    font-size: 11px;
                    font-weight: bold;
                    color: {highlight_color or '#ffffff'};
                    background-color: {highlight_color}22;
                    border: 1px solid {highlight_color}55;
                    border-radius: 3px;
                    padding: 2px 8px;
                    font-family: monospace;
                """)
            else:
                color_css = f"color: {highlight_color};" if highlight_color else "color: #f3f4f6;"
                val_widget.setStyleSheet(f"font-size: 11px; font-weight: 600; {color_css} font-family: monospace;")
            row.addWidget(val_widget)
            card_layout.addLayout(row)

        disp_status = f"{status.upper()} ({defects_count} defects)"
        status_color = "#34d399" if is_pass else "#f87171"
        add_row("Quality Disposition:", disp_status, status_color, is_badge=True)
        add_row("Station Run ID:", f"#{local_id}" if local_id else "Auto")
        if cloud_id:
            add_row("Supabase Cloud UID:", f"{cloud_id[:13]}...")
        add_row("Inspecting Operator:", f"{operator_email or 'station_operator'} ({operator_role.upper() or 'ENGINEER'})", "#38bdf8")
        add_row("AI Detection Model:", model or "yolov8s", "#a78bfa")
        add_row("Source Optical Frame:", source or "inspection_frame.jpg")
        add_row("Sync Target Destination:", "Supabase PostgreSQL • Bucket: pcb-vision", "#10b981")
        add_row("Timestamp (UTC):", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"), "#9ca3af")

        layout.addWidget(card)

        # Bottom Button Bar
        btn_layout = QHBoxLayout()
        btn_layout.addStretch()
        btn_ok = QPushButton("Acknowledge & Continue")
        btn_ok.setFixedSize(180, 36)
        btn_ok.setCursor(Qt.PointingHandCursor)
        btn_ok.setStyleSheet("""
            QPushButton {
                background-color: #0284c7;
                color: #ffffff;
                font-weight: bold;
                font-size: 12px;
                border-radius: 4px;
                border: 1px solid #0369a1;
            }
            QPushButton:hover {
                background-color: #0369a1;
            }
            QPushButton:pressed {
                background-color: #075985;
            }
        """)
        btn_ok.clicked.connect(self.accept)
        btn_layout.addWidget(btn_ok)
        layout.addLayout(btn_layout)


def show_sync_confirmation(
    parent,
    local_id: int | None = None,
    cloud_id: str | None = None,
    source: str = "",
    model: str = "",
    status: str = "PASS",
    defects_count: int = 0,
    operator_email: str = "",
    operator_role: str = "",
    synced: bool = True,
    msg: str = "",
):
    """Helper function to instantiate and exec the confirmation dialog."""
    dlg = SyncConfirmationDialog(
        parent=parent,
        local_id=local_id,
        cloud_id=cloud_id,
        source=source,
        model=model,
        status=status,
        defects_count=defects_count,
        operator_email=operator_email,
        operator_role=operator_role,
        synced=synced,
        msg=msg,
    )
    dlg.exec()
