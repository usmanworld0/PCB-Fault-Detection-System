"""Train Faster R-CNN or RetinaNet (torchvision) on the YOLO format tile dataset made by
prepare_pku.py / merge_datasets.py, and write a model folder the app can load.

Usage (Kaggle, GPU on). Run the smoke test first, it takes a couple of minutes:
  python train_tv.py --arch fasterrcnn --name fasterrcnn --data /kaggle/working/pku_yolo --smoke
  python train_tv.py --arch fasterrcnn --name fasterrcnn --data /kaggle/working/pku_yolo --epochs 12
  python train_tv.py --arch retinanet  --name retinanet  --data /kaggle/working/pku_yolo --epochs 12
Needs detmetrics.py in the same folder. Output: models_out/<name>/ (model.pt, config.json, classes.txt, metrics.json)
"""
import argparse
import json
import random
import re
import time
from pathlib import Path

import cv2
import numpy as np
import torch
from torch.utils.data import DataLoader, Dataset

import detmetrics as dm

SIZE = 640


def read_names(yaml_path):
    names = {}
    for line in Path(yaml_path).read_text().splitlines():
        m = re.match(r"^\s+(\d+):\s*(.+?)\s*$", line)
        if m:
            names[int(m.group(1))] = m.group(2)
    return [names[i] for i in sorted(names)]


class YoloTiles(Dataset):
    def __init__(self, root, split, train, max_n=0, seed=0):
        self.root, self.split, self.train = Path(root), split, train
        self.imgs = sorted((self.root / "images" / split).glob("*.jpg"))
        if max_n and len(self.imgs) > max_n:
            self.imgs = random.Random(seed).sample(self.imgs, max_n)

    def __len__(self):
        return len(self.imgs)

    def load(self, i):
        p = self.imgs[i]
        rgb = cv2.cvtColor(cv2.imread(str(p)), cv2.COLOR_BGR2RGB)
        h, w = rgb.shape[:2]
        boxes, cls = dm.read_yolo_labels(self.root / "labels" / self.split / (p.stem + ".txt"), w, h)
        return rgb, boxes, cls

    def __getitem__(self, i):
        rgb, boxes, cls = self.load(i)
        h, w = rgb.shape[:2]
        if self.train:
            if random.random() < 0.5:
                rgb = rgb[:, ::-1]
                boxes = boxes.copy(); boxes[:, [0, 2]] = w - boxes[:, [2, 0]]
            if random.random() < 0.5:
                rgb = rgb[::-1]
                boxes = boxes.copy(); boxes[:, [1, 3]] = h - boxes[:, [3, 1]]
            rgb = np.ascontiguousarray(rgb)
        img = torch.from_numpy(rgb).permute(2, 0, 1).float() / 255
        target = {"boxes": torch.as_tensor(boxes, dtype=torch.float32).reshape(-1, 4),
                  "labels": torch.as_tensor(cls + 1, dtype=torch.int64)}   # 0 is background
        return img, target


def collate(batch):
    return tuple(zip(*batch))


def build(arch, n_classes, pretrained):
    """Keep in sync with build_torchvision() in core/detector.py (the app rebuilds the same network)."""
    from torchvision.models import ResNet50_Weights
    from torchvision.models import detection as D
    kw = dict(min_size=SIZE, max_size=SIZE)
    if arch == "fasterrcnn":
        if pretrained:   # start from COCO detection weights, replace only the last layer
            from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
            m = D.fasterrcnn_resnet50_fpn_v2(weights=D.FasterRCNN_ResNet50_FPN_V2_Weights.DEFAULT, **kw)
            m.roi_heads.box_predictor = FastRCNNPredictor(
                m.roi_heads.box_predictor.cls_score.in_features, n_classes + 1)
        else:
            m = D.fasterrcnn_resnet50_fpn_v2(weights=None, weights_backbone=None, num_classes=n_classes + 1, **kw)
        m.roi_heads.score_thresh = 0.001
        m.roi_heads.detections_per_img = 100
    elif arch == "retinanet":
        wb = ResNet50_Weights.IMAGENET1K_V2 if pretrained else None   # ImageNet backbone, new heads
        m = D.retinanet_resnet50_fpn_v2(weights=None, weights_backbone=wb, num_classes=n_classes + 1, **kw)
        m.score_thresh = 0.001
        m.detections_per_img = 300
    else:
        raise SystemExit(f"unknown --arch {arch}")
    return m


@torch.no_grad()
def predict_dataset(model, ds, dev, bs=8):
    model.eval()
    preds, gts = [], []
    for s in range(0, len(ds), bs):
        items = [ds.load(i) for i in range(s, min(s + bs, len(ds)))]
        batch = [torch.from_numpy(r).permute(2, 0, 1).float().div(255).to(dev) for r, _, _ in items]
        outs = model(batch)
        for o, (_, boxes, cls) in zip(outs, items):
            preds.append((o["boxes"].cpu().numpy(), o["scores"].cpu().numpy(),
                          o["labels"].cpu().numpy().astype(np.int64) - 1))
            gts.append((boxes, cls))
    return preds, gts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--arch", choices=["fasterrcnn", "retinanet"], required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--epochs", type=int, default=12)
    ap.add_argument("--batch", type=int, default=4)
    ap.add_argument("--lr", type=float, default=None)
    ap.add_argument("--val_n", type=int, default=300, help="validation tiles used to pick the best epoch")
    ap.add_argument("--out", default="models_out")
    ap.add_argument("--smoke", action="store_true", help="tiny run to check that everything works")
    a = ap.parse_args()

    dev = "cuda" if torch.cuda.is_available() else "cpu"
    random.seed(0); torch.manual_seed(0)
    data = Path(a.data)
    names = read_names(next(data.glob("*.yaml")))
    n = len(names)
    lr = a.lr or (0.005 if a.arch == "fasterrcnn" else 0.001)
    max_train, max_val, max_test = (16, 8, 8) if a.smoke else (0, a.val_n, 0)
    epochs = 1 if a.smoke else a.epochs

    train_ds = YoloTiles(data, "train", True, max_train)
    val_ds = YoloTiles(data, "val", False, max_val)
    test_ds = YoloTiles(data, "test", False, max_test)
    print(f"device {dev} | train {len(train_ds)} val {len(val_ds)} test {len(test_ds)} tiles | classes {names}")
    loader = DataLoader(train_ds, batch_size=a.batch, shuffle=True, num_workers=2, collate_fn=collate)

    model = build(a.arch, n, True).to(dev)
    params = [p for p in model.parameters() if p.requires_grad]
    opt = torch.optim.SGD(params, lr=lr, momentum=0.9, weight_decay=1e-4)
    total = epochs * len(loader)
    warm = min(300, max(1, total // 5))
    sched = torch.optim.lr_scheduler.LambdaLR(
        opt, lambda it: min(1.0, (it + 1) / warm) * (0.5 * (1 + np.cos(np.pi * it / max(total, 1))) * 0.99 + 0.01))
    scaler = torch.amp.GradScaler("cuda", enabled=(dev == "cuda"))

    dest = Path(a.out) / a.name
    dest.mkdir(parents=True, exist_ok=True)
    best = -1.0
    for ep in range(1, epochs + 1):
        model.train()
        t0, run = time.time(), 0.0
        for k, (imgs, tgts) in enumerate(loader, 1):
            imgs = [i.to(dev) for i in imgs]
            tgts = [{key: v.to(dev) for key, v in t.items()} for t in tgts]
            with torch.autocast(device_type="cuda", enabled=(dev == "cuda")):
                loss = sum(model(imgs, tgts).values())
            if not torch.isfinite(loss):
                print("non finite loss, skipping batch")
                opt.zero_grad(); continue
            opt.zero_grad()
            scaler.scale(loss).backward()
            scaler.unscale_(opt)
            torch.nn.utils.clip_grad_norm_(params, 10.0)
            scaler.step(opt); scaler.update(); sched.step()
            run += float(loss)
            if k % 100 == 0:
                print(f"  epoch {ep} iter {k}/{len(loader)} loss {run / k:.3f}", flush=True)
        preds, gts = predict_dataset(model, val_ds, dev)
        m = dm.evaluate(preds, gts, n)
        print(f"epoch {ep}/{epochs} | loss {run / max(len(loader), 1):.3f} | val mAP50 {m['map50']:.3f} "
              f"mAP50-95 {m['map50_95']:.3f} | {time.time() - t0:.0f}s", flush=True)
        if m["map50"] >= best:
            best = m["map50"]
            torch.save(model.state_dict(), dest / "model.pt")

    model.load_state_dict(torch.load(dest / "model.pt", map_location=dev))
    preds, gts = predict_dataset(model, test_ds, dev)
    m = dm.evaluate(preds, gts, n)
    # speed with batch size 1 on this GPU (the laptop CPU speed comes from evaluate_all.py)
    ds, times = test_ds, []
    with torch.no_grad():
        for i in range(min(30, len(ds))):
            r, _, _ = ds.load(i)
            t = torch.from_numpy(r).permute(2, 0, 1).float().div(255).to(dev)
            if dev == "cuda":
                torch.cuda.synchronize()
            t1 = time.time(); model([t])
            if dev == "cuda":
                torch.cuda.synchronize()
            times.append((time.time() - t1) * 1000)
    metrics = {k: (round(v, 4) if isinstance(v, float) else v) for k, v in m.items()
               if k not in ("per_class_map50", "per_class_map50_95", "roc_image")}
    metrics["per_class_map50_95"] = {names[c]: round(v, 4) for c, v in m["per_class_map50_95"].items()}
    metrics.update({"model": a.name, "arch": a.arch, "epochs": epochs, "imgsz": SIZE,
                    "gpu_inference_ms": round(float(np.median(times[3:])) if len(times) > 3 else 0.0, 1),
                    "test_split": f"{data.name} test tiles ({len(test_ds)})"})
    (dest / "metrics.json").write_text(json.dumps(metrics, indent=2))
    (dest / "config.json").write_text(json.dumps({"arch": a.arch, "classes": names, "imgsz": SIZE}, indent=2))
    (dest / "classes.txt").write_text("\n".join(names))
    print(json.dumps(metrics, indent=2))
    print("saved", dest)


if __name__ == "__main__":
    main()
