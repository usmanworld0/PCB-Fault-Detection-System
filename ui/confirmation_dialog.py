"""Industrial Confirmation Modal for PCB-Vision Inspection Station.
Displays detailed telemetry and verification when inspection runs are committed.
Clean, modern light enterprise theme.
"""
from pathlib import Path
from datetime import datetime, timezone
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QPainter, QColor, QPen, QBrush, QPixmap, QGuiApplication
from PySide6.QtWidgets import (
    QDialog,
    QVBoxLayout,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QFrame,
    QWidget,
)

# Locate official logo asset
_ASSETS_DIR = Path(__file__).resolve().parent / "assets"
_LOGO_FILE = _ASSETS_DIR / "logo.png"
if not _LOGO_FILE.exists():
    _FALLBACK_LOGO = Path(__file__).resolve().parent.parent / "web" / "public" / "logo.png"
    if _FALLBACK_LOGO.exists():
        _LOGO_FILE = _FALLBACK_LOGO


class BrandLogoWidget(QWidget):
    """Clean, high-DPI branded app emblem with dark contrast tile for white surfaces."""

    def __init__(self, size: int = 42, parent=None):
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


class StatusBadgeWidget(QWidget):
    """Clean vector-drawn verification emblem optimized for light backgrounds."""

    def __init__(self, is_pass: bool, is_synced: bool, parent=None):
        super().__init__(parent)
        self.is_pass = is_pass
        self.is_synced = is_synced
        self.setFixedSize(46, 46)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)

        if not self.is_synced:
            # Offline / Queued state: Amber tone
            bg_col = QColor(254, 243, 199)       # #fef3c7
            border_col = QColor(245, 158, 11)     # #f59e0b
            icon_col = QColor(217, 119, 6)        # #d97706
        elif self.is_pass:
            # Pass state: Emerald green tone
            bg_col = QColor(236, 253, 245)       # #ecfdf5
            border_col = QColor(16, 185, 129)     # #10b981
            icon_col = QColor(5, 150, 105)        # #059669
        else:
            # Defect / Fail state: Coral crimson tone
            bg_col = QColor(255, 241, 242)       # #fff1f2
            border_col = QColor(244, 63, 94)      # #f43f5e
            icon_col = QColor(225, 29, 72)        # #e11d48

        # Background circular badge
        painter.setBrush(QBrush(bg_col))
        painter.setPen(QPen(border_col, 1.5))
        painter.drawEllipse(2, 2, 42, 42)

        # Draw crisp icon
        pen = QPen(icon_col, 2.5, Qt.SolidLine, Qt.RoundCap, Qt.RoundJoin)
        painter.setPen(pen)

        if not self.is_synced:
            # Disk / Queue symbol
            painter.drawRoundedRect(13, 13, 20, 20, 3, 3)
            painter.drawLine(17, 13, 17, 19)
            painter.drawLine(25, 13, 25, 19)
            painter.drawLine(16, 27, 30, 27)
        elif self.is_pass:
            # Clean checkmark
            painter.drawLine(15, 24, 20, 29)
            painter.drawLine(20, 29, 31, 17)
        else:
            # Exclamation warning
            painter.drawLine(23, 14, 23, 24)
            painter.drawPoint(23, 30)


class SyncConfirmationDialog(QDialog):
    """Clean white enterprise modal confirming inspection record persistence."""

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
        self.setWindowTitle("Inspection Record Committed — PCB Fault Detection")
        self.setFixedSize(560, 465)
        self.setModal(True)

        self.local_id = local_id
        self.cloud_id = cloud_id
        self.source = source
        self.is_pass = status.upper() == "PASS"
        self.synced = synced

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
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 24, 28, 22)
        layout.setSpacing(14)

        # ---- Header Bar with Status Emblem and Brand Logo ----
        header_box = QHBoxLayout()
        header_box.setSpacing(14)

        badge_icon = StatusBadgeWidget(is_pass=self.is_pass, is_synced=synced)
        header_box.addWidget(badge_icon)

        title_vbox = QVBoxLayout()
        title_vbox.setSpacing(2)

        if synced:
            if self.is_pass:
                title_text = "Inspection Record Synchronized"
                subtitle_text = "Record verified and archived to cloud database & storage"
            else:
                title_text = "Defect Flagged & Synchronized"
                subtitle_text = f"{defects_count} defect(s) logged and published for engineering review"
        else:
            if self.is_pass:
                title_text = "Inspection Record Saved Locally"
                subtitle_text = msg or "Record logged to station queue (offline mode)"
            else:
                title_text = "Defect Flagged & Saved Locally"
                subtitle_text = msg or f"{defects_count} defect(s) queued locally for sync"

        lbl_title = QLabel(title_text)
        lbl_title.setStyleSheet("font-size: 16px; font-weight: 700; color: #0f172a;")

        lbl_sub = QLabel(subtitle_text)
        lbl_sub.setStyleSheet("font-size: 11px; color: #64748b;")

        title_vbox.addWidget(lbl_title)
        title_vbox.addWidget(lbl_sub)
        header_box.addLayout(title_vbox, 1)

        # Right-side official logo watermark tile
        logo_badge = BrandLogoWidget(size=44)
        header_box.addWidget(logo_badge)

        layout.addLayout(header_box)

        # ---- 3 Summary KPI Metric Cards (Light Mode) ----
        metrics_layout = QHBoxLayout()
        metrics_layout.setSpacing(10)

        # 1. Disposition Card
        if self.is_pass:
            card_disp = self._create_metric_card(
                card_id="cardDisp",
                label="DISPOSITION",
                val="PASS",
                sub="0 Flaws Detected",
                val_color="#15803d",
                bg_color="#f0fdf4",
                border_color="#bbf7d0",
            )
        else:
            card_disp = self._create_metric_card(
                card_id="cardDisp",
                label="DISPOSITION",
                val=f"DEFECT ({defects_count})",
                sub=f"{defects_count} Anomalies Flagged",
                val_color="#e11d48",
                bg_color="#fff1f2",
                border_color="#fecdd3",
            )
        metrics_layout.addWidget(card_disp)

        # 2. Sequence Run ID Card
        run_str = f"#{local_id}" if local_id else "AUTO"
        card_run = self._create_metric_card(
            card_id="cardRun",
            label="STATION RUN",
            val=run_str,
            sub="Sequence ID",
            val_color="#0f172a",
            bg_color="#f8fafc",
            border_color="#e2e8f0",
        )
        metrics_layout.addWidget(card_run)

        # 3. Ingestion State Card
        if synced:
            card_sync = self._create_metric_card(
                card_id="cardSync",
                label="PIPELINE STATUS",
                val="Synchronized",
                sub="Cloud Ledger",
                val_color="#0284c7",
                bg_color="#f0f9ff",
                border_color="#bae6fd",
            )
        else:
            card_sync = self._create_metric_card(
                card_id="cardSync",
                label="PIPELINE STATUS",
                val="Station Queue",
                sub="Local SQLite Queue",
                val_color="#d97706",
                bg_color="#fffbeb",
                border_color="#fde68a",
            )
        metrics_layout.addWidget(card_sync)

        layout.addLayout(metrics_layout)

        # ---- Telemetry Data Panel (Light Mode) ----
        data_panel = QFrame()
        data_panel.setObjectName("dataPanel")
        data_panel.setStyleSheet("""
            QFrame#dataPanel {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
            }
        """)
        panel_layout = QVBoxLayout(data_panel)
        panel_layout.setContentsMargins(16, 14, 16, 14)
        panel_layout.setSpacing(9)

        # Telemetry Rows
        clean_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        short_source = source if len(source) <= 32 else f"{source[:16]}...{source[-12:]}"

        self._add_row(panel_layout, "Optical Sample", short_source or "inspection_frame.jpg")
        self._add_row(panel_layout, "Vision Engine", model or "yolov8s")
        self._add_row(
            panel_layout,
            "Operator Attribution",
            f"{operator_email or 'station_operator'} ({operator_role.upper() or 'ENGINEER'})",
            val_color="#1e293b",
        )

        if cloud_id:
            short_cloud = f"{cloud_id[:16]}..." if len(cloud_id) > 16 else cloud_id
            self._add_row(panel_layout, "Cloud Record Signature", short_cloud, is_mono=True, val_color="#0284c7")
        else:
            self._add_row(panel_layout, "Storage Target", "Local Station SQLite Database", val_color="#d97706")

        self._add_row(panel_layout, "Timestamp", clean_time, is_mono=True, val_color="#64748b")

        layout.addWidget(data_panel)

        # ---- Action Buttons ----
        layout.addStretch()

        btn_box = QHBoxLayout()
        btn_box.setSpacing(10)

        self.btn_copy = QPushButton("Copy Record Info")
        self.btn_copy.setFixedHeight(38)
        self.btn_copy.setCursor(Qt.PointingHandCursor)
        self.btn_copy.setStyleSheet("""
            QPushButton {
                background-color: #ffffff;
                color: #475569;
                font-size: 12px;
                font-weight: 600;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 0 16px;
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
        self.btn_copy.clicked.connect(self._copy_record_info)
        btn_box.addWidget(self.btn_copy)

        btn_box.addStretch()

        self.btn_done = QPushButton("Continue Inspection")
        self.btn_done.setFixedHeight(38)
        self.btn_done.setFixedWidth(160)
        self.btn_done.setCursor(Qt.PointingHandCursor)
        self.btn_done.setStyleSheet("""
            QPushButton {
                background-color: #2563eb;
                color: #ffffff;
                font-size: 13px;
                font-weight: 600;
                border: 1px solid #1d4ed8;
                border-radius: 6px;
            }
            QPushButton:hover {
                background-color: #1d4ed8;
            }
            QPushButton:pressed {
                background-color: #1e40af;
            }
        """)
        self.btn_done.clicked.connect(self.accept)
        self.btn_done.setDefault(True)
        btn_box.addWidget(self.btn_done)

        layout.addLayout(btn_box)

    def _create_metric_card(
        self,
        card_id: str,
        label: str,
        val: str,
        sub: str,
        val_color: str,
        bg_color: str,
        border_color: str,
    ) -> QFrame:
        card = QFrame()
        card.setObjectName(card_id)
        card.setStyleSheet(f"""
            QFrame {{
                background-color: {bg_color};
                border: 1px solid {border_color};
                border-radius: 6px;
            }}
            QLabel {{
                border: none;
                background: transparent;
            }}
        """)
        vbox = QVBoxLayout(card)
        vbox.setContentsMargins(12, 9, 12, 9)
        vbox.setSpacing(2)

        lbl = QLabel(label)
        lbl.setStyleSheet("font-size: 9px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;")

        val_w = QLabel(val)
        val_w.setStyleSheet(f"font-size: 15px; font-weight: 700; color: {val_color};")

        sub_w = QLabel(sub)
        sub_w.setStyleSheet("font-size: 10px; color: #64748b;")

        vbox.addWidget(lbl)
        vbox.addWidget(val_w)
        vbox.addWidget(sub_w)
        return card

    def _add_row(
        self,
        layout: QVBoxLayout,
        label_text: str,
        val_text: str,
        val_color: str = "#0f172a",
        is_mono: bool = False,
    ):
        row = QHBoxLayout()
        row.setSpacing(8)

        lbl = QLabel(label_text)
        lbl.setStyleSheet("font-size: 11px; font-weight: 500; color: #64748b;")
        row.addWidget(lbl)

        row.addStretch()

        val = QLabel(val_text)
        font_family = "Consolas, monospace" if is_mono else "'Segoe UI', Arial, sans-serif"
        val.setStyleSheet(f"font-size: 11px; font-weight: 600; color: {val_color}; font-family: {font_family};")
        row.addWidget(val)

        layout.addLayout(row)

    def _copy_record_info(self):
        info = (
            f"PCB Fault Detection Run #{self.local_id}\n"
            f"Cloud UID: {self.cloud_id or 'N/A'}\n"
            f"Source: {self.source}\n"
            f"Disposition: {'PASS' if self.is_pass else 'DEFECT'}\n"
            f"Synced: {self.synced}"
        )
        clipboard = QGuiApplication.clipboard()
        if clipboard:
            clipboard.setText(info)
        self.btn_copy.setText("✓ Copied!")
        QTimer.singleShot(1800, lambda: self.btn_copy.setText("Copy Record Info"))


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
