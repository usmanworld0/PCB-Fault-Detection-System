import time
from pathlib import Path

import cv2
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtWidgets import (QCheckBox, QComboBox, QDialog, QFileDialog, QHBoxLayout, QHeaderView,
                               QLabel, QMainWindow, QPushButton, QSizePolicy, QSlider,
                               QTableWidget, QTableWidgetItem, QVBoxLayout, QWidget, QFrame, QMessageBox)

from core import store
from core.detector import list_models
from core.draw import draw_detections
from core.sources import FolderSource, WebcamSource, read_image
from core.sync import sync_pending
from core.models_sync import sync_models
from core.compare import compare_all
from core.auth import check_role_permission, clear_active_session, get_active_session
from ui.login_dialog import LoginDialog
from ui.confirmation_dialog import show_sync_confirmation

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


class ImageView(QLabel):
    def __init__(self, title):
        super().__init__(title)
        self.setAlignment(Qt.AlignCenter)
        self.setMinimumSize(300, 300)
        self.setSizePolicy(QSizePolicy.Ignored, QSizePolicy.Ignored)
        self.setStyleSheet("border: 1px solid #888;")
        self._pix = None

    def set_image(self, bgr):
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        h, w, _ = rgb.shape
        self._pix = QPixmap.fromImage(QImage(rgb.data, w, h, 3 * w, QImage.Format_RGB888).copy())
        self._refresh()

    def _refresh(self):
        if self._pix:
            self.setPixmap(self._pix.scaled(self.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))

    def resizeEvent(self, e):
        super().resizeEvent(e)
        self._refresh()


class LiveWorker(QThread):
    """Reads frames and runs the model off the UI thread. If the model is slower than
    the camera, frames are skipped naturally because we always read the newest one."""
    frame_ready = Signal(object, object)
    failed = Signal(str)

    def __init__(self, source, detector, conf):
        super().__init__()
        self.source, self.detector, self.conf = source, detector, conf
        self._running = True

    def run(self):
        try:
            while self._running:
                ok, frame = self.source.read()
                if not ok:
                    self.failed.emit("Could not read from the camera")
                    break
                self.frame_ready.emit(frame, self.detector.predict(frame, self.conf))
        finally:
            self.source.release()

    def stop(self):
        self._running = False
        self.wait(3000)


class MainWindow(QMainWindow):
    def __init__(self, current_user: dict | None = None):
        super().__init__()
        self.setWindowTitle("PCB-Vision Inspection Station")
        self.resize(1400, 820)
        self.current_user = current_user or get_active_session() or {
            "email": "admin@example.com",
            "role": "admin",
            "id": "admin-001",
        }
        self.models = list_models(MODELS_DIR)
        self.detector = None
        self.source = None
        self.worker = None
        self.current = None       # (frame, name)
        self.last = None          # (frame, annotated, result, name)
        self.last_autosave = 0.0

        # ---- Operator Identity Header Card (Left Panel) ----
        self.operator_card = QFrame()
        self.operator_card.setStyleSheet("""
            QFrame {
                background-color: #1e293b;
                border: 1px solid #334155;
                border-radius: 6px;
                padding: 6px;
            }
        """)
        op_layout = QVBoxLayout(self.operator_card)
        op_layout.setSpacing(2)

        lbl_op_title = QLabel("OPERATOR IDENTITY")
        lbl_op_title.setStyleSheet("font-size: 9px; font-mono; font-weight: bold; color: #94a3b8;")
        self.lbl_op_email = QLabel(self.current_user.get("email", "operator"))
        self.lbl_op_email.setStyleSheet("font-size: 11px; font-weight: bold; color: #ffffff;")
        self.lbl_op_role = QLabel(self.current_user.get("role", "viewer").upper())
        self.lbl_op_role.setStyleSheet("""
            font-size: 10px;
            font-weight: bold;
            font-family: monospace;
            color: #38bdf8;
            background-color: #0369a133;
            border: 1px solid #0284c755;
            border-radius: 3px;
            padding: 1px 4px;
            max-width: 140px;
        """)
        self.btn_switch_user = QPushButton("Switch / Sign Out")
        self.btn_switch_user.setCursor(Qt.PointingHandCursor)
        self.btn_switch_user.setStyleSheet("""
            QPushButton {
                background-color: #0f172a;
                color: #94a3b8;
                font-size: 10px;
                border: 1px solid #334155;
                border-radius: 3px;
                padding: 3px 6px;
            }
            QPushButton:hover {
                background-color: #334155;
                color: #ffffff;
            }
        """)
        self.btn_switch_user.clicked.connect(self.switch_operator)

        op_layout.addWidget(lbl_op_title)
        op_layout.addWidget(self.lbl_op_email)
        op_layout.addWidget(self.lbl_op_role)
        op_layout.addWidget(self.btn_switch_user)

        # left panel controls
        self.model_box = QComboBox()
        self.model_box.addItems(list(self.models))
        real_models = [m for m in self.models.keys() if m != "Demo (no model)"]
        if real_models:
            best_choice = next((m for m in real_models if "yolov8s" in m), real_models[0])
            idx = self.model_box.findText(best_choice)
            if idx >= 0:
                self.model_box.setCurrentIndex(idx)
        self.btn_live = QPushButton("Start live feed")
        self.btn_image = QPushButton("Select image")
        self.btn_folder = QPushButton("Select folder")
        self.btn_prev = QPushButton("Previous")
        self.btn_next = QPushButton("Next")
        self.conf_label = QLabel("Confidence: 0.25")
        self.conf = QSlider(Qt.Horizontal)
        self.conf.setRange(5, 95)
        self.conf.setValue(25)
        self.chk_auto = QCheckBox("Auto-save frames with defects")
        self.btn_save = QPushButton("Save to DB")
        self.btn_sync = QPushButton("Sync to DB")
        self.btn_models_sync = QPushButton("Sync models")
        self.btn_compare = QPushButton("Compare all models")
        self.btn_compare.setEnabled(False)

        left = QVBoxLayout()
        left.addWidget(self.operator_card)
        left.addSpacing(6)
        for w in (QLabel("Model Architecture"), self.model_box, self.btn_live, self.btn_image, self.btn_folder,
                  self.btn_prev, self.btn_next, self.conf_label, self.conf, self.chk_auto,
                  self.btn_save, self.btn_sync, self.btn_models_sync, self.btn_compare):
            left.addWidget(w)
        left.addStretch()
        left_w = QWidget()
        left_w.setLayout(left)
        left_w.setFixedWidth(240)

        # centre
        self.view_in = ImageView("Input")
        self.view_out = ImageView("Detections")
        views = QHBoxLayout()
        views.addWidget(self.view_in)
        views.addWidget(self.view_out)
        self.status = QLabel("No image")
        self.status.setStyleSheet("font-size: 18px; font-weight: bold;")
        self.info = QLabel("")
        self.table = QTableWidget(0, 4)
        self.table.setHorizontalHeaderLabels(["Class", "Confidence", "Severity", "Box (x1,y1,x2,y2)"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        self.table.setEditTriggers(QTableWidget.NoEditTriggers)
        self.table.setFixedHeight(170)
        centre = QVBoxLayout()
        centre.addLayout(views, 1)
        row = QHBoxLayout()
        row.addWidget(self.status)
        row.addStretch()
        row.addWidget(self.info)
        centre.addLayout(row)
        centre.addWidget(self.table)
        centre_w = QWidget()
        centre_w.setLayout(centre)

        root = QHBoxLayout()
        root.addWidget(left_w)
        root.addWidget(centre_w, 1)
        holder = QWidget()
        holder.setLayout(root)
        self.setCentralWidget(holder)

        self.btn_live.clicked.connect(self.toggle_live)
        self.btn_image.clicked.connect(self.open_image)
        self.btn_folder.clicked.connect(self.open_folder)
        self.btn_prev.clicked.connect(lambda: self.step(-1))
        self.btn_next.clicked.connect(lambda: self.step(1))
        self.conf.valueChanged.connect(self.on_conf)
        self.model_box.currentTextChanged.connect(self.load_model)
        self.btn_save.clicked.connect(self.save_current)
        self.btn_sync.clicked.connect(self.sync)
        self.btn_models_sync.clicked.connect(self.sync_models)
        self.btn_compare.clicked.connect(self.compare_models)

        # Apply role permissions & load model
        self.apply_role_permissions()
        self.load_model(self.model_box.currentText())

    def apply_role_permissions(self):
        """Enforces Role-Based Access Control on station controls."""
        role = self.current_user.get("role", "viewer").lower()
        self.lbl_op_email.setText(self.current_user.get("email", "operator"))
        self.lbl_op_role.setText(role.upper())

        can_save = check_role_permission(role, "save")
        can_sync = check_role_permission(role, "sync")
        can_models_sync = check_role_permission(role, "sync_models")

        self.btn_save.setEnabled(can_save)
        if not can_save:
            self.btn_save.setToolTip("Viewer role: Read-only access. Saving boards requires Quality Engineer or Admin role.")
        else:
            self.btn_save.setToolTip("Save inspection frame and sync directly to database")

        self.btn_sync.setEnabled(can_sync)
        if not can_sync:
            self.btn_sync.setToolTip("Viewer role: Read-only access.")
        else:
            self.btn_sync.setToolTip("Synchronize local queue to Supabase database")

        self.btn_models_sync.setEnabled(can_models_sync)
        if not can_models_sync:
            self.btn_models_sync.setToolTip("Admin privilege required to sync models.")
        else:
            self.btn_models_sync.setToolTip("Upload model benchmark metrics to Supabase")

        self.chk_auto.setEnabled(can_save)

    def switch_operator(self):
        """Prompts login dialog to switch active station operator."""
        clear_active_session()
        dlg = LoginDialog(self)
        if dlg.exec() == QDialog.Accepted and dlg.authenticated_user:
            self.current_user = dlg.authenticated_user
            self.apply_role_permissions()
            self.statusBar().showMessage(f"Active operator switched: {self.current_user['email']} ({self.current_user['role'].upper()})")

    # ---- model ----
    def load_model(self, label):
        try:
            self.detector = self.models[label]()
        except Exception as e:
            self.statusBar().showMessage(f"Could not load model: {e}")
            return
        if self.worker:
            self.worker.detector = self.detector
        self.statusBar().showMessage(f"Model loaded: {label}")
        if self.current and not self.worker:
            self.run_on(*self.current)

    def conf_value(self):
        return self.conf.value() / 100.0

    def on_conf(self):
        self.conf_label.setText(f"Confidence: {self.conf_value():.2f}")
        if self.worker:
            self.worker.conf = self.conf_value()
        elif self.current:
            self.run_on(*self.current)

    # ---- sources ----
    def open_image(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select image", "",
                                              "Images (*.jpg *.jpeg *.png *.bmp *.tif *.tiff)")
        if path:
            self.stop_live()
            self.source = FolderSource([Path(path)])
            self.run_on(*self.source.current())

    def open_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "Select folder")
        if folder:
            self.stop_live()
            src = FolderSource.from_folder(folder)
            if not len(src):
                self.statusBar().showMessage("No images in that folder")
                return
            self.source = src
            self.run_on(*self.source.current())

    def step(self, delta):
        if self.source and not self.worker and len(self.source) > 1:
            self.run_on(*self.source.step(delta))

    def toggle_live(self):
        if self.worker:
            self.stop_live()
            return
        cam = WebcamSource(0)
        if not cam.is_open():
            self.statusBar().showMessage("No camera found")
            return
        self.worker = LiveWorker(cam, self.detector, self.conf_value())
        self.worker.frame_ready.connect(self.on_live_frame)
        self.worker.failed.connect(lambda m: (self.statusBar().showMessage(m), self.stop_live()))
        self.worker.start()
        self.btn_live.setText("Stop live feed")

    def stop_live(self):
        if self.worker:
            self.worker.stop()
            self.worker = None
            self.btn_live.setText("Start live feed")

    # ---- inference display ----
    def run_on(self, frame, name):
        if frame is None:
            self.statusBar().showMessage(f"Could not read {name}")
            return
        self.current = (frame, name)
        self.btn_compare.setEnabled(True)
        result = self.detector.predict(frame, self.conf_value())
        self.display(frame, result, name)

    def on_live_frame(self, frame, result):
        self.display(frame, result, "live")
        if self.chk_auto.isChecked() and result.detections and time.time() - self.last_autosave > 2:
            self.last_autosave = time.time()
            self.save_current()

    def display(self, frame, result, name):
        annotated = draw_detections(frame, result.detections)
        self.last = (frame, annotated, result, name)
        self.view_in.set_image(frame)
        self.view_out.set_image(annotated)
        color = "#c62828" if result.status == "FAIL" else "#2e7d32"
        self.status.setText(f"{result.status}  ({len(result.detections)} defects)")
        self.status.setStyleSheet(f"font-size: 18px; font-weight: bold; color: {color};")
        self.info.setText(f"{name}   |   {result.model}   |   {result.ms:.0f} ms")
        self.table.setRowCount(len(result.detections))
        for i, d in enumerate(result.detections):
            vals = [d.cls, f"{d.conf:.2f}", d.severity, ", ".join(str(int(v)) for v in d.box)]
            for j, v in enumerate(vals):
                self.table.setItem(i, j, QTableWidgetItem(v))

    # ---- history and sync ----
    def save_current(self):
        if not self.last:
            QMessageBox.information(self, "No Image", "Please select an image or start a camera feed first.")
            return

        # Enforce RBAC
        role = self.current_user.get("role", "viewer")
        if not check_role_permission(role, "save"):
            QMessageBox.warning(
                self,
                "Permission Denied",
                f"Operator '{self.current_user.get('email')}' has '{role.upper()}' role (Read-Only).\n"
                "Saving inspection records to the database requires Quality Engineer or Admin privileges."
            )
            return

        frame, annotated, result, name = self.last
        operator_email = self.current_user.get("email", "operator")
        operator_role = self.current_user.get("role", "engineer")

        # 1. Save locally with operator attribution
        rid = store.save(frame, annotated, result, name,
                         operator_email=operator_email,
                         operator_role=operator_role)

        # 2. Push immediately to Supabase Cloud Database + Storage
        sent, failed, msg, details = sync_pending()
        total, unsynced = store.count()

        cloud_id = details[0].get("id") if details else None
        synced_flag = sent > 0

        # 3. Show Industrial Confirmation Popup Dialog
        show_sync_confirmation(
            parent=self,
            local_id=rid,
            cloud_id=cloud_id,
            source=name,
            model=result.model,
            status=result.status,
            defects_count=len(result.detections),
            operator_email=operator_email,
            operator_role=operator_role,
            synced=synced_flag,
            msg=msg,
        )

        if synced_flag:
            self.statusBar().showMessage(f"✓ Saved #{rid} & Synced to Supabase Database ({total} total runs)")
        elif unsynced > 0:
            self.statusBar().showMessage(f"Saved #{rid} locally ({total} total, {unsynced} queued for sync)")
        else:
            self.statusBar().showMessage(f"Saved #{rid} ({total} total)")

    def sync(self):
        role = self.current_user.get("role", "viewer")
        if not check_role_permission(role, "sync"):
            QMessageBox.warning(
                self,
                "Permission Denied",
                f"Operator '{self.current_user.get('email')}' has '{role.upper()}' role.\n"
                "Database synchronization requires Quality Engineer or Admin privileges."
            )
            return

        sent, failed, msg, details = sync_pending()
        if sent > 0:
            QMessageBox.information(
                self,
                "Database Sync Completed",
                f"✓ Successfully synchronized {sent} pending inspection(s) to Supabase Cloud Database.\n"
                f"Destination: Supabase PostgreSQL & Storage ('pcb-vision').\n"
                f"Operator: {self.current_user.get('email')} ({self.current_user.get('role', '').upper()})"
            )
        elif failed > 0:
            QMessageBox.warning(
                self,
                "Database Sync Warning",
                f"Sync completed with issues: {sent} sent, {failed} failed.\nMessage: {msg}"
            )
        else:
            QMessageBox.information(
                self,
                "Database Synchronized",
                "All local inspection runs are already synchronized with Supabase Database."
            )
        self.statusBar().showMessage(f"Sync: {sent} sent, {failed} failed ({msg})")

    def sync_models(self):
        role = self.current_user.get("role", "viewer")
        if not check_role_permission(role, "sync_models"):
            QMessageBox.warning(
                self,
                "Permission Denied",
                f"Model registry sync requires ADMIN role.\nCurrent role: {role.upper()}"
            )
            return
        sent, failed, msg = sync_models()
        QMessageBox.information(
            self,
            "Model Registry Sync",
            f"Model Sync Outcome:\n{sent} models uploaded to Supabase, {failed} failed.\n({msg})"
        )
        self.statusBar().showMessage(f"Model sync: {sent} sent, {failed} failed ({msg})")

    def compare_models(self):
        if not self.current:
            return
        frame, _ = self.current
        try:
            rows = compare_all(self.models, frame, self.conf_value())
        except Exception as e:
            self.statusBar().showMessage(f"Model comparison failed: {e}")
            return
        dialog = QDialog(self)
        dialog.setWindowTitle("Compare all models")
        table = QTableWidget(len(rows), 8, dialog)
        table.setHorizontalHeaderLabels(["Model", "Defects", "Top class", "Status", "ms", "mAP50", "Precision", "Recall"])
        table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        table.setEditTriggers(QTableWidget.NoEditTriggers)
        for row_index, row in enumerate(rows):
            values = [row["model"], str(row["defects"]), row["top_class"], row["status"],
                      f'{row["ms"]:.1f}', f'{row["map50"]:.3f}', f'{row["precision"]:.3f}', f'{row["recall"]:.3f}']
            for column, value in enumerate(values):
                table.setItem(row_index, column, QTableWidgetItem(value))
        layout = QVBoxLayout(dialog)
        layout.addWidget(table)
        dialog.resize(900, 300)
        dialog.exec()

    def closeEvent(self, e):
        self.stop_live()
        super().closeEvent(e)
