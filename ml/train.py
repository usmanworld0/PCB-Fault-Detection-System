"""Train one YOLO model, evaluate it on the test split, export ONNX, and write a model
folder the desktop app can load.
Usage (Kaggle):
  !pip install ultralytics
  !python train.py --model yolov8s.pt --name yolov8s --data /kaggle/working/pcb_yolo/pcb.yaml
Then download  models_out/<name>/  and put it inside pcb_station/models/ on your laptop."""
import argparse
import json
import shutil
from pathlib import Path

from ultralytics import YOLO


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="yolov8s.pt")
    ap.add_argument("--name", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--epochs", type=int, default=50)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--out", default="models_out")
    a = ap.parse_args()

    model = YOLO(a.model)
    model.train(data=a.data, epochs=a.epochs, imgsz=a.imgsz, batch=a.batch,
                name=a.name, project="runs", exist_ok=True, seed=0)

    best = Path(model.trainer.best)  # newer Ultralytics puts runs under runs/detect/, so ask it
    best_model = YOLO(str(best))
    res = best_model.val(data=a.data, split="test", imgsz=a.imgsz, batch=a.batch)
    p, r = float(res.box.mp), float(res.box.mr)
    names = [best_model.names[i] for i in sorted(best_model.names)]
    metrics = {
        "model": a.name, "map50": float(res.box.map50), "map50_95": float(res.box.map),
        "precision": p, "recall": r, "f1": 2 * p * r / (p + r + 1e-9),
        "gpu_inference_ms": float(res.speed["inference"]),
        "per_class_map50_95": dict(zip(names, [float(x) for x in res.box.maps])),
        "epochs": a.epochs, "imgsz": a.imgsz, "test_split": "DeepPCB official test",
    }

    onnx_path = Path(best_model.export(format="onnx", imgsz=a.imgsz, opset=12, simplify=True))
    dest = Path(a.out) / a.name
    dest.mkdir(parents=True, exist_ok=True)
    shutil.copy(onnx_path, dest / "model.onnx")
    shutil.copy(best, dest / "best.pt")
    (dest / "classes.txt").write_text("\n".join(names))
    (dest / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
