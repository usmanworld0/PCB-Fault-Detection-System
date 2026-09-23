import ast
import json
import time
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

from .severity import rate

DEFAULT_CLASSES = ["open", "short", "mousebite", "spur", "copper", "pinhole"]
TILE_TRIGGER = 1.5      # images larger than this many times the model size are cut into tiles
TILE_OVERLAP = 0.2


@dataclass
class Detection:
    cls: str
    conf: float
    box: tuple  # x1, y1, x2, y2 in original image pixels
    severity: str


@dataclass
class Result:
    detections: list = field(default_factory=list)
    ms: float = 0.0
    model: str = ""

    @property
    def status(self):
        return "FAIL" if self.detections else "PASS"

    def to_dict(self):
        return {
            "status": self.status,
            "model": self.model,
            "inference_ms": round(self.ms, 1),
            "defects": [
                {"class": d.cls, "confidence": round(d.conf, 4),
                 "box": [round(float(v), 1) for v in d.box], "severity": d.severity}
                for d in self.detections
            ],
        }


class DummyDetector:
    """Fake detector so the UI can be built and demoed before any model exists."""
    name = "Demo (no model)"

    def predict(self, bgr, conf=0.25, iou=0.45):
        t0 = time.perf_counter()
        h, w = bgr.shape[:2]
        rng = np.random.default_rng(int(bgr.mean() * 1000) % (2 ** 32))
        dets = []
        for _ in range(int(rng.integers(1, 4))):
            cls = DEFAULT_CLASSES[int(rng.integers(0, len(DEFAULT_CLASSES)))]
            c = float(rng.uniform(0.3, 0.95))
            if c < conf:
                continue
            bw, bh = int(w * 0.06), int(h * 0.06)
            x1 = int(rng.integers(0, w - bw)); y1 = int(rng.integers(0, h - bh))
            dets.append(Detection(cls, c, (x1, y1, x1 + bw, y1 + bh), rate(cls, c)))
        return Result(dets, (time.perf_counter() - t0) * 1000, self.name)


def tile_starts(length, tile, stride):
    if length <= tile:
        return [0]
    s = list(range(0, length - tile + 1, stride))
    if s[-1] != length - tile:
        s.append(length - tile)
    return s


class BaseDetector:
    """Shared logic: tiling of large images, class-aware NMS, severity.
    A subclass only has to implement _infer(image, conf) -> (boxes[N,4] xyxy, scores[N], class ids[N])."""
    name = "model"
    size = 640
    classes = DEFAULT_CLASSES

    def _infer(self, img, conf):
        raise NotImplementedError

    def predict(self, bgr, conf=0.25, iou=0.45):
        t0 = time.perf_counter()
        h, w = bgr.shape[:2]
        S = self.size
        if max(h, w) > TILE_TRIGGER * S:
            stride = int(S * (1 - TILE_OVERLAP))
            bs, ss, cs = [], [], []
            for y0 in tile_starts(h, S, stride):
                for x0 in tile_starts(w, S, stride):
                    b, s, c = self._infer(bgr[y0:y0 + S, x0:x0 + S], conf)
                    if len(s):
                        b = b.copy()
                        b[:, [0, 2]] += x0
                        b[:, [1, 3]] += y0
                        bs.append(b); ss.append(s); cs.append(c)
            if bs:
                boxes, scores, cls_ids = np.concatenate(bs), np.concatenate(ss), np.concatenate(cs)
            else:
                boxes, scores, cls_ids = np.zeros((0, 4)), np.zeros(0), np.zeros(0, int)
        else:
            boxes, scores, cls_ids = self._infer(bgr, conf)
        dets = self._nms(boxes, scores, cls_ids, conf, iou)
        return Result(dets, (time.perf_counter() - t0) * 1000, self.name)

    def _nms(self, boxes, scores, cls_ids, conf, iou):
        dets = []
        if len(scores) == 0:
            return dets
        off = cls_ids * 100000.0          # class-aware: boxes of different classes never suppress each other
        nms_boxes = [[float(b[0] + o), float(b[1]), float(b[2] - b[0]), float(b[3] - b[1])]
                     for b, o in zip(boxes, off)]
        idx = cv2.dnn.NMSBoxes(nms_boxes, [float(s) for s in scores], conf, iou)
        for i in np.array(idx).flatten():
            name = self.classes[int(cls_ids[i])]
            c = float(scores[i])
            dets.append(Detection(name, c, tuple(float(v) for v in boxes[i]), rate(name, c)))
        return dets


class OnnxYoloDetector(BaseDetector):
    """Runs a YOLOv8 model exported with ultralytics (format=onnx)."""

    def __init__(self, model_dir):
        model_dir = Path(model_dir)
        self.name = model_dir.name
        self.use_cv2 = True
        onnx_path = str(model_dir / "model.onnx")

        # OpenCV DNN is fast, built-in, and reliable across all Windows environments
        self.net = cv2.dnn.readNetFromONNX(onnx_path)
        self.size = 640
        self.classes = _load_classes(model_dir)

    @staticmethod
    def _letterbox(img, size):
        h, w = img.shape[:2]
        r = min(size / w, size / h)
        nw, nh = int(round(w * r)), int(round(h * r))
        resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
        canvas = np.full((size, size, 3), 114, np.uint8)
        dx, dy = (size - nw) // 2, (size - nh) // 2
        canvas[dy:dy + nh, dx:dx + nw] = resized
        return canvas, r, dx, dy

    def _infer(self, img, conf):
        h0, w0 = img.shape[:2]
        canvas, r, dx, dy = self._letterbox(img, self.size)
        blob = cv2.dnn.blobFromImage(canvas, 1 / 255.0, (self.size, self.size), swapRB=True)
        if self.use_cv2:
            self.net.setInput(blob)
            out = self.net.forward()
        else:
            out = self.session.run(None, {self.input_name: blob})[0]
        pred = out[0].T                                   # (N, 4 + num_classes)
        nc = len(self.classes)
        scores = pred[:, 4:4 + nc]
        cls_ids = scores.argmax(1)
        confs = scores.max(1)
        keep = confs >= conf
        pred, cls_ids, confs = pred[keep], cls_ids[keep], confs[keep]
        if len(confs) == 0:
            return np.zeros((0, 4)), np.zeros(0), np.zeros(0, int)
        cx, cy, bw, bh = pred[:, 0], pred[:, 1], pred[:, 2], pred[:, 3]
        boxes = np.stack([np.clip((cx - bw / 2 - dx) / r, 0, w0), np.clip((cy - bh / 2 - dy) / r, 0, h0),
                          np.clip((cx + bw / 2 - dx) / r, 0, w0), np.clip((cy + bh / 2 - dy) / r, 0, h0)], 1)
        return boxes, confs, cls_ids


def build_torchvision(arch, n_classes, size=640):
    """Same architecture as ml/train_tv.py (without downloading weights). n_classes excludes background."""
    from torchvision.models import detection as D
    kw = dict(min_size=size, max_size=size, weights=None, weights_backbone=None, num_classes=n_classes + 1)
    if arch == "fasterrcnn":
        m = D.fasterrcnn_resnet50_fpn_v2(**kw)
        m.roi_heads.score_thresh = 0.001
        m.roi_heads.detections_per_img = 100
    elif arch == "retinanet":
        m = D.retinanet_resnet50_fpn_v2(**kw)
        m.score_thresh = 0.001
        m.detections_per_img = 300
    else:
        raise ValueError(f"unknown architecture {arch}")
    return m


class TorchvisionDetector(BaseDetector):
    """Faster R-CNN or RetinaNet trained with ml/train_tv.py. Needs torch and torchvision installed."""

    def __init__(self, model_dir, device="cpu"):
        import torch
        model_dir = Path(model_dir)
        cfg = json.loads((model_dir / "config.json").read_text())
        self.name = model_dir.name
        self.classes = cfg["classes"]
        self.size = int(cfg.get("imgsz", 640))
        self.torch = torch
        self.device = device
        self.model = build_torchvision(cfg["arch"], len(self.classes), self.size)
        res = self.model.load_state_dict(torch.load(model_dir / "model.pt", map_location="cpu", weights_only=False), strict=False)
        bad = [k for k in res.missing_keys if not k.endswith("num_batches_tracked")] + list(res.unexpected_keys)
        if bad:
            raise RuntimeError(f"weights do not match the architecture: {bad[:5]}")
        self.model.to(device).eval()

    def _infer(self, img, conf):
        torch = self.torch
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        t = torch.from_numpy(rgb).permute(2, 0, 1).float().div(255).to(self.device)
        with torch.no_grad():
            out = self.model([t])[0]
        b = out["boxes"].cpu().numpy()
        s = out["scores"].cpu().numpy()
        c = out["labels"].cpu().numpy().astype(int) - 1     # labels start at 1, 0 is background
        keep = s >= conf
        return b[keep], s[keep], c[keep]


def _load_classes(model_dir, session=None):
    f = model_dir / "classes.txt"
    if f.exists():
        return [l.strip() for l in f.read_text().splitlines() if l.strip()]
    if session is not None:
        try:
            names = ast.literal_eval(session.get_modelmeta().custom_metadata_map["names"])
            return [names[i] for i in sorted(names)]
        except Exception:
            pass
    return list(DEFAULT_CLASSES)


def load_model_dir(model_dir, device="cpu", metrics=None):
    """Loads whatever kind of model is in the folder. Raises if it cannot."""
    model_dir = Path(model_dir)
    if metrics is None:
        metrics = {}
        metrics_file = model_dir / "metrics.json"
        if metrics_file.exists():
            try:
                metrics = json.loads(metrics_file.read_text())
            except (OSError, json.JSONDecodeError):
                pass
    if (model_dir / "model.onnx").exists():
        detector = OnnxYoloDetector(model_dir)
        detector._metrics = metrics
        return detector
    if (model_dir / "config.json").exists() and (model_dir / "model.pt").exists():
        detector = TorchvisionDetector(model_dir, device)
        detector._metrics = metrics
        return detector
    raise FileNotFoundError(f"no model.onnx or model.pt + config.json in {model_dir}")


class ModelLoader:
    """Callable loader that keeps a model folder's metrics in memory."""

    def __init__(self, model_dir):
        self.model_dir = Path(model_dir)
        self.metrics = {}
        metrics_file = self.model_dir / "metrics.json"
        if metrics_file.exists():
            try:
                self.metrics = json.loads(metrics_file.read_text())
            except (OSError, json.JSONDecodeError):
                pass

    def __call__(self):
        return load_model_dir(self.model_dir, metrics=self.metrics)


def list_models(models_dir):
    """Returns {label: loader_function}. Each subfolder of models/ with a model is one model.
    Only models physically present in the models folder are returned.
    Torch models only show up if torch and torchvision are installed."""
    found = {}
    models_dir = Path(models_dir)
    if not models_dir.exists():
        return {DummyDetector.name: lambda: DummyDetector()}
    try:
        import torch, torchvision  # noqa: F401
        have_torch = True
    except Exception:
        have_torch = False
    for d in sorted(p for p in models_dir.iterdir() if p.is_dir()):
        is_onnx = (d / "model.onnx").exists()
        is_tv = (d / "model.pt").exists() and (d / "config.json").exists()
        if not (is_onnx or (is_tv and have_torch)):
            continue
        label = d.name
        loader = ModelLoader(d)
        if "map50" in loader.metrics:
            try:
                label = f"{d.name}  (mAP50 {loader.metrics['map50']:.3f})"
            except (TypeError, ValueError):
                pass
        found[label] = loader
    if not found:
        found[DummyDetector.name] = lambda: DummyDetector()
    return found
