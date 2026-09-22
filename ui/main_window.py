import time
from pathlib import Path

import cv2
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QImage, QPixmap
from PySide6.QtWidgets import (QCheckBox, QComboBox, QDialog, QFileDialog, QHBoxLayout, QHeaderView,
                               QLabel, QMainWindow, QPushButton, QSizePolicy, QSlider,
                               QTableWidget, QTableWidgetItem, QVBoxLayout, QWidget)

from core import store
from core.detector import list_models
from core.draw import draw_detections
from core.sources import FolderSource, WebcamSource, read_image
from core.sync import sync_pending
from core.models_sync import sync_models
from core.compare import compare_all

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
    def __init__(self):
        super().__init__()
        self.setWindowTitle("PCB-Vision Inspection Station")
        self.resize(1400, 800)
        self.models = list_models(MODELS_DIR)
        self.detector = None
        self.source = None
        self.worker = None
        self.current = None       # (frame, name)
        self.last = None          # (frame, annotated, result, name)
        self.last_autosave = 0.0

        # left panel
        self.model_box = QComboBox()
        self.model_box.addItems(list(self.models))
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
        self.btn_save = QPushButton("Save result")
        self.btn_sync = QPushButton("Sync to server")
        self.btn_models_sync = QPushButton("Sync models")
        self.btn_compare = QPushButton("Compare all models")
        self.btn_compare.setEnabled(False)
        left = QVBoxLayout()
        for w in (QLabel("Model"), self.model_box, self.btn_live, self.btn_image, self.btn_folder,
                  self.btn_prev, self.btn_next, self.conf_label, self.conf, self.chk_auto,
                  self.btn_save, self.btn_sync, self.btn_models_sync, self.btn_compare):
            left.addWidget(w)
        left.addStretch()
        left_w = QWidget()
        left_w.setLayout(left)
        left_w.setFixedWidth(230)

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
        self.load_model(self.model_box.currentText())

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
            return
        frame, annotated, result, name = self.last
        rid = store.save(frame, annotated, result, name)
        total, unsynced = store.count()
        self.statusBar().showMessage(f"Saved #{rid}  ({total} total, {unsynced} not synced)")

    def sync(self):
        sent, failed, msg = sync_pending()
        self.statusBar().showMessage(f"Sync: {sent} sent, {failed} failed ({msg})")

    def sync_models(self):
        sent, failed, msg = sync_models()
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
