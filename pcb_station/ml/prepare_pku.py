"""Converts PKU-Market-PCB (Pascal VOC XML labels) into YOLO format, cut into overlapping tiles.

Usage (Kaggle):
  python prepare_pku.py --src /kaggle/input/<pku-folder> --out /kaggle/working/pku_yolo --preview 20

Why tiles: the photos are large (thousands of pixels) and the defects are tiny. Shrinking a
whole photo to 640 would make them vanish, so each photo is cut into 640 x 640 tiles.

Why split by board: every image of one board is almost the same picture with different defects
added. The file name starts with the board number (01_open_circuit_03.jpg), so whole boards go
to train, val or test. Rotated copies are skipped, they would leak between splits.
"""
import argparse
import json
import random
import re
from collections import Counter
from pathlib import Path
import xml.etree.ElementTree as ET

import cv2
import numpy as np

NAMES = ["open", "short", "mousebite", "spur", "copper", "missing_hole"]
ALIASES = {
    "open_circuit": "open", "open": "open",
    "short": "short",
    "mouse_bite": "mousebite", "mousebite": "mousebite",
    "spur": "spur",
    "spurious_copper": "copper", "copper": "copper",
    "missing_hole": "missing_hole",
}
IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp"}
COLORS = [(0, 0, 255), (0, 128, 255), (0, 200, 0), (255, 0, 0), (255, 0, 255), (0, 200, 200)]


def read_image(path):
    return cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)


def is_rotated(path, src):
    # look only inside the dataset folder, not at the folders above it
    return any("rotat" in part.lower() for part in path.relative_to(src).parts)


def find_pairs(src):
    images = {}
    for p in src.rglob("*"):
        if p.suffix.lower() in IMG_EXT and not is_rotated(p, src):
            images.setdefault(p.stem, p)
    pairs, skipped_rot, no_img = [], 0, 0
    for x in sorted(src.rglob("*.xml")):
        if is_rotated(x, src):
            skipped_rot += 1
            continue
        if x.stem in images:
            pairs.append((images[x.stem], x))
        else:
            no_img += 1
    print(f"found {len(pairs)} image+xml pairs, skipped {skipped_rot} rotated xml, "
          f"{no_img} xml without an image")
    return pairs


def read_boxes(xml_path, unknown):
    boxes = []
    for o in ET.parse(xml_path).getroot().iter("object"):
        raw = (o.findtext("name") or "").strip().lower().replace("-", "_").replace(" ", "_")
        cls = ALIASES.get(raw)
        if cls is None:
            unknown[raw] += 1
            continue
        bb = o.find("bndbox")
        x1, y1, x2, y2 = [float(bb.findtext(k)) for k in ("xmin", "ymin", "xmax", "ymax")]
        boxes.append((NAMES.index(cls), x1, y1, x2, y2))
    return boxes


def starts(length, tile, stride):
    if length <= tile:
        return [0]
    s = list(range(0, length - tile + 1, stride))
    if s[-1] != length - tile:
        s.append(length - tile)
    return s


def make_tiles(img, boxes, tile, stride, min_visible):
    """Returns (positive_tiles, empty_tiles). Each item is (x0, y0, crop, labels)."""
    h, w = img.shape[:2]
    pos, empty = [], []
    for y0 in starts(h, tile, stride):
        for x0 in starts(w, tile, stride):
            crop = img[y0:y0 + tile, x0:x0 + tile]
            ch, cw = crop.shape[:2]
            labels, ambiguous = [], False
            for c, x1, y1, x2, y2 in boxes:
                ix1, iy1 = max(x1, x0), max(y1, y0)
                ix2, iy2 = min(x2, x0 + cw), min(y2, y0 + ch)
                iw, ih = ix2 - ix1, iy2 - iy1
                if iw <= 0 or ih <= 0:
                    continue
                visible = (iw * ih) / max((x2 - x1) * (y2 - y1), 1e-6)
                if visible >= min_visible and iw >= 2 and ih >= 2:
                    labels.append((c, (ix1 - x0 + iw / 2) / cw, (iy1 - y0 + ih / 2) / ch,
                                   iw / cw, ih / ch))
                else:
                    ambiguous = True   # a cut-off defect that is not labelled here
            if ambiguous:
                continue
            (pos if labels else empty).append((x0, y0, crop, labels))
    return pos, empty


def board_id(stem):
    m = re.match(r"(\d+)_", stem)
    return int(m.group(1)) if m else None


def draw_preview(out, n, rng):
    files = sorted((out / "labels" / "train").glob("*.txt"))
    files = [f for f in files if f.read_text().strip()]
    (out / "preview").mkdir(exist_ok=True)
    for f in rng.sample(files, min(n, len(files))):
        img = cv2.imread(str(out / "images" / "train" / (f.stem + ".jpg")))
        h, w = img.shape[:2]
        for line in f.read_text().split("\n"):
            c, cx, cy, bw, bh = line.split()
            c, cx, cy, bw, bh = int(c), float(cx) * w, float(cy) * h, float(bw) * w, float(bh) * h
            p1, p2 = (int(cx - bw / 2), int(cy - bh / 2)), (int(cx + bw / 2), int(cy + bh / 2))
            cv2.rectangle(img, p1, p2, COLORS[c % len(COLORS)], 2)
            cv2.putText(img, NAMES[c], (p1[0], max(12, p1[1] - 4)), cv2.FONT_HERSHEY_SIMPLEX,
                        0.5, COLORS[c % len(COLORS)], 1, cv2.LINE_AA)
        cv2.imwrite(str(out / "preview" / (f.stem + ".jpg")), img)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", default="pku_yolo")
    ap.add_argument("--tile", type=int, default=640)
    ap.add_argument("--overlap", type=float, default=0.2)
    ap.add_argument("--min_visible", type=float, default=0.5,
                    help="keep a box in a tile only if at least this share of it is inside")
    ap.add_argument("--neg_ratio", type=float, default=0.5,
                    help="empty tiles kept per tile with defects (teaches the model what a good area looks like)")
    ap.add_argument("--val_boards", type=int, nargs="*", default=[7, 9])
    ap.add_argument("--test_boards", type=int, nargs="*", default=[4, 10])
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--preview", type=int, default=0, help="save this many tiles with boxes drawn")
    a = ap.parse_args()

    rng = random.Random(a.seed)
    src, out = Path(a.src), Path(a.out)
    stride = int(a.tile * (1 - a.overlap))
    pairs = find_pairs(src)
    if not pairs:
        raise SystemExit("No image+xml pairs found. Check --src and send me the folder layout.")

    unknown = Counter()
    stats = {s: {"images": 0, "tiles": 0, "boxes": Counter()} for s in ("train", "val", "test")}
    no_board = 0
    for split in stats:
        (out / "images" / split).mkdir(parents=True, exist_ok=True)
        (out / "labels" / split).mkdir(parents=True, exist_ok=True)

    for n, (img_path, xml_path) in enumerate(pairs, 1):
        b = board_id(img_path.stem)
        if b is None:
            no_board += 1
            r = rng.random()
            split = "train" if r < 0.7 else ("val" if r < 0.85 else "test")
        else:
            split = "test" if b in a.test_boards else ("val" if b in a.val_boards else "train")
        img = read_image(img_path)
        if img is None:
            print("could not read", img_path)
            continue
        boxes = read_boxes(xml_path, unknown)
        pos, empty = make_tiles(img, boxes, a.tile, stride, a.min_visible)
        k = min(len(empty), int(round(a.neg_ratio * len(pos))))
        keep = pos + rng.sample(empty, k)
        for x0, y0, crop, labels in keep:
            name = f"{img_path.stem}_x{x0}_y{y0}"
            cv2.imwrite(str(out / "images" / split / f"{name}.jpg"), crop,
                        [cv2.IMWRITE_JPEG_QUALITY, 95])
            (out / "labels" / split / f"{name}.txt").write_text(
                "\n".join(f"{c} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}" for c, cx, cy, w, h in labels))
            for c, *_ in labels:
                stats[split]["boxes"][NAMES[c]] += 1
        stats[split]["images"] += 1
        stats[split]["tiles"] += len(keep)
        if n % 100 == 0:
            print(f"{n}/{len(pairs)} images done")

    yaml = f"path: {out.resolve()}\ntrain: images/train\nval: images/val\ntest: images/test\nnames:\n"
    yaml += "".join(f"  {i}: {n}\n" for i, n in enumerate(NAMES))
    (out / "pku.yaml").write_text(yaml)
    (out / "split_report.json").write_text(json.dumps(
        {s: {"images": v["images"], "tiles": v["tiles"], "boxes": dict(v["boxes"])}
         for s, v in stats.items()}, indent=2))

    print()
    for s, v in stats.items():
        print(f"{s}: {v['images']} photos -> {v['tiles']} tiles, boxes {dict(v['boxes'])}")
    if unknown:
        print("WARNING unknown class names in xml (skipped):", dict(unknown))
    if no_board:
        print(f"WARNING {no_board} files had no board number in the name, they were split at random "
              "(this can leak between train and test)")
    if a.preview:
        draw_preview(out, a.preview, rng)
        print("preview images saved in", out / "preview")
    print("wrote", out / "pku.yaml")


if __name__ == "__main__":
    main()
