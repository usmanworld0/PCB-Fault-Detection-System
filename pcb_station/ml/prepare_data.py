"""Converts DeepPCB to YOLO format.
Usage (Kaggle):  !git clone https://github.com/tangsanli5201/DeepPCB
                 !python prepare_data.py --src DeepPCB --out /kaggle/working/pcb_yolo
Uses only the *_test.jpg images (the defective ones), keeps the official train/test
split, and takes 15% of train as validation with a fixed seed."""
import argparse
import random
import shutil
from pathlib import Path

from PIL import Image

NAMES = ["open", "short", "mousebite", "spur", "copper", "pinhole"]  # DeepPCB ids 1..6


def read_list(root, name):
    items = []
    for line in (root / name).read_text().splitlines():
        if not line.strip():
            continue
        img_rel, ann_rel = line.split()          # space separated
        img = root / img_rel.replace(".jpg", "_test.jpg")
        items.append((img, root / ann_rel))
    return items


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default="DeepPCB")
    ap.add_argument("--out", default="pcb_yolo")
    ap.add_argument("--val_frac", type=float, default=0.15)
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args()

    root, out = Path(a.src) / "PCBData", Path(a.out)
    train_all, test = read_list(root, "trainval.txt"), read_list(root, "test.txt")
    random.Random(a.seed).shuffle(train_all)
    n_val = int(a.val_frac * len(train_all))
    splits = {"val": train_all[:n_val], "train": train_all[n_val:], "test": test}

    for split, items in splits.items():
        (out / "images" / split).mkdir(parents=True, exist_ok=True)
        (out / "labels" / split).mkdir(parents=True, exist_ok=True)
        for img, ann in items:
            w, h = Image.open(img).size
            lines = []
            for row in ann.read_text().strip().splitlines():
                x1, y1, x2, y2, c = map(int, row.replace(",", " ").split())
                lines.append(f"{c - 1} {(x1 + x2) / 2 / w:.6f} {(y1 + y2) / 2 / h:.6f} "
                             f"{(x2 - x1) / w:.6f} {(y2 - y1) / h:.6f}")
            name = img.name.replace("_test", "")
            shutil.copy(img, out / "images" / split / name)
            (out / "labels" / split / name.replace(".jpg", ".txt")).write_text("\n".join(lines))
        print(split, len(items))

    yaml = f"path: {out.resolve()}\ntrain: images/train\nval: images/val\ntest: images/test\nnames:\n"
    yaml += "".join(f"  {i}: {n}\n" for i, n in enumerate(NAMES))
    (out / "pcb.yaml").write_text(yaml)
    print("wrote", out / "pcb.yaml")


if __name__ == "__main__":
    main()
