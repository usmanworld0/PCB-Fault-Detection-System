"""Scores every model in models/ on the same test images with the same code, on this computer's CPU.
This produces the experiment table for the report (Phase 6) and a metrics.json in each model folder.

Run from the pcb_station folder:
  python ml/evaluate_all.py --data C:\\path\\to\\pku_yolo --split test
  python ml/evaluate_all.py --data C:\\path\\to\\pku_yolo --only yolov8s fasterrcnn --max_images 300

Models whose class list differs from the dataset (for example the DeepPCB models, which have
'pinhole' instead of 'missing_hole') are skipped, because their scores would not be comparable.
"""
import argparse
import csv
import json
import platform
import random
import re
import sys
import time
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import detmetrics as dm                                     # noqa: E402
from core.detector import load_model_dir                    # noqa: E402


def read_names(yaml_path):
    names = {}
    for line in Path(yaml_path).read_text().splitlines():
        m = re.match(r"^\s+(\d+):\s*(.+?)\s*$", line)
        if m:
            names[int(m.group(1))] = m.group(2)
    return [names[i] for i in sorted(names)]


def load_split(data, split, max_images, seed=0):
    imgs = sorted((data / "images" / split).glob("*.jpg"))
    if max_images and len(imgs) > max_images:
        imgs = random.Random(seed).sample(imgs, max_images)
    gts = []
    for p in imgs:
        h, w = cv2.imread(str(p)).shape[:2]
        gts.append(dm.read_yolo_labels(data / "labels" / split / (p.stem + ".txt"), w, h))
    return imgs, gts


def run_model(det, imgs, gts, n_classes, conf_op=0.25, warmup=3):
    preds, times = [], []
    for k, p in enumerate(imgs):
        img = cv2.imread(str(p))
        res = det.predict(img, conf=0.001, iou=0.6)
        if k >= warmup:
            times.append(res.ms)
        if res.detections:
            b = np.array([d.box for d in res.detections], np.float32)
            s = np.array([d.conf for d in res.detections], np.float32)
            c = np.array([det.classes.index(d.cls) for d in res.detections], np.int64)
        else:
            b, s, c = np.zeros((0, 4), np.float32), np.zeros(0, np.float32), np.zeros(0, np.int64)
        preds.append((b, s, c))
    m = dm.evaluate(preds, gts, n_classes, conf_op)
    m["cpu_ms_median"] = float(np.median(times)) if times else None
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True, help="YOLO dataset folder with images/, labels/ and a yaml")
    ap.add_argument("--split", default="test")
    ap.add_argument("--models", default="models")
    ap.add_argument("--only", nargs="*", help="only these model folder names")
    ap.add_argument("--max_images", type=int, default=0, help="score a random subset (faster)")
    ap.add_argument("--conf", type=float, default=0.25, help="operating point for precision/recall/F1")
    ap.add_argument("--device", default="cpu", help="for torch models")
    ap.add_argument("--out", default="experiments.csv")
    a = ap.parse_args()

    data = Path(a.data)
    yamls = sorted(data.glob("*.yaml"))
    if not yamls:
        raise SystemExit(f"no yaml file in {data}")
    names = read_names(yamls[0])
    imgs, gts = load_split(data, a.split, a.max_images)
    n_gt = sum(len(g[1]) for g in gts)
    print(f"{len(imgs)} {a.split} images, {n_gt} boxes, classes: {names}\n")

    rows = []
    for d in sorted(p for p in Path(a.models).iterdir() if p.is_dir()):
        if a.only and d.name not in a.only:
            continue
        try:
            det = load_model_dir(d, a.device) if a.device != "cpu" else load_model_dir(d)
        except FileNotFoundError:
            continue
        except Exception as e:
            print(f"SKIP {d.name}: could not load ({e})")
            continue
        if list(det.classes) != names:
            print(f"SKIP {d.name}: classes {det.classes} differ from the dataset {names}")
            continue
        print(f"scoring {d.name} ...", flush=True)
        t0 = time.time()
        m = run_model(det, imgs, gts, len(names), a.conf)
        m["per_class_map50"] = {names[c]: round(v, 4) for c, v in m["per_class_map50"].items()}
        m["per_class_map50_95"] = {names[c]: round(v, 4) for c, v in m["per_class_map50_95"].items()}
        m.update({"model": d.name, "eval_split": a.split, "eval_images": len(imgs), "eval_boxes": n_gt,
                  "eval_dataset": data.name, "timed_on": platform.processor() or platform.machine(),
                  "device": a.device})
        mf = d / "metrics.json"
        old = json.loads(mf.read_text()) if mf.exists() else {}
        if "trainer_reported" not in old and "map50" in old:
            old = {"trainer_reported": {k: old[k] for k in ("map50", "map50_95", "precision", "recall", "f1") if k in old},
                   **{k: v for k, v in old.items() if k not in ("map50", "map50_95", "precision", "recall", "f1")}}
        old.update({k: (round(v, 4) if isinstance(v, float) else v) for k, v in m.items()})
        mf.write_text(json.dumps(old, indent=2))
        rows.append(old)
        print(f"  mAP50 {m['map50']:.3f}  mAP50-95 {m['map50_95']:.3f}  P {m['precision']:.3f}  R {m['recall']:.3f}  "
              f"F1 {m['f1']:.3f}  CPU {m['cpu_ms_median']:.0f} ms  ({time.time() - t0:.0f}s)")

    if not rows:
        print("No comparable models found.")
        return
    cols = ["model", "eval_dataset", "eval_split", "map50", "map50_95", "precision", "recall", "f1",
            "auc_image", "cpu_ms_median"]
    with open(a.out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for r in rows:
            w.writerow([round(r[c], 4) if isinstance(r.get(c), float) else r.get(c) for c in cols])
    print(f"\nwrote {a.out}")
    print("\n" + " | ".join(f"{c:>13}" for c in cols[:1] + cols[3:]))
    for r in rows:
        print(" | ".join(f"{(round(r[c], 3) if isinstance(r.get(c), float) else r.get(c)):>13}" for c in cols[:1] + cols[3:]))


if __name__ == "__main__":
    main()
