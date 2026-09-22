"""Merges several YOLO format datasets (each already tiled and split) into one dataset with one class list.

Example:
  python merge_datasets.py --out unified --src pku_yolo --src roboflow_pcb --src other:my_class=short

Each --src is a folder with images/{train,val|valid,test}, labels/... and a yaml that lists the class names.
Class names are matched automatically (open_circuit -> open, mouse_bite -> mousebite, spurious_copper -> copper ...).
Extra renames go after the colon:  folder:old_name=new_name,old2=new2
Images that contain a class which is not in the unified list are SKIPPED (a defect left unlabelled
would teach the model to ignore it). The script prints how many were skipped and why.
"""
import argparse
import json
import re
import shutil
from collections import Counter
from pathlib import Path

NAMES = ["open", "short", "mousebite", "spur", "copper", "missing_hole"]
ALIASES = {
    "open_circuit": "open", "open": "open", "opencircuit": "open",
    "short": "short", "short_circuit": "short",
    "mouse_bite": "mousebite", "mousebite": "mousebite",
    "spur": "spur",
    "spurious_copper": "copper", "copper": "copper",
    "missing_hole": "missing_hole", "missing_holes": "missing_hole",
}
SPLIT_DIRS = {"train": "train", "val": "val", "valid": "val", "validation": "val", "test": "test"}


def norm(name):
    return re.sub(r"[\s\-]+", "_", name.strip().lower())


def read_names(folder):
    for y in sorted(folder.glob("*.yaml")) + sorted(folder.glob("*.yml")):
        text = y.read_text()
        m = re.search(r"^names:\s*\[(.*?)\]", text, re.S | re.M)          # names: ['a', 'b']
        if m:
            return [s.strip().strip("'\"") for s in m.group(1).split(",") if s.strip()]
        d = {}
        for line in text.splitlines():                                     # names:\n  0: a
            mm = re.match(r"^\s+(\d+):\s*(.+?)\s*$", line)
            if mm:
                d[int(mm.group(1))] = mm.group(2).strip("'\"")
        if d:
            return [d[i] for i in sorted(d)]
    raise SystemExit(f"no class names found in a yaml file in {folder}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--src", action="append", required=True)
    ap.add_argument("--names", nargs="*", default=NAMES, help="unified class list, in order")
    a = ap.parse_args()

    names = list(a.names)
    out = Path(a.out)
    counts = {s: Counter() for s in ("train", "val", "test")}
    imgs_kept = {s: 0 for s in counts}
    skipped = Counter()
    for split in counts:
        (out / "images" / split).mkdir(parents=True, exist_ok=True)
        (out / "labels" / split).mkdir(parents=True, exist_ok=True)

    for spec in a.src:
        folder, _, extra = spec.partition(":")
        folder = Path(folder)
        renames = {norm(k): norm(v) for k, v in (p.split("=") for p in extra.split(",") if "=" in p)}
        src_names = read_names(folder)
        mapping = {}
        for i, n in enumerate(src_names):
            target = renames.get(norm(n)) or ALIASES.get(norm(n)) or norm(n)
            mapping[i] = names.index(target) if target in names else None
        print(f"{folder.name}: " + ", ".join(
            f"{n}->{names[mapping[i]] if mapping[i] is not None else 'NOT USED'}" for i, n in enumerate(src_names)))
        for sd in (folder / "images").iterdir():
            split = SPLIT_DIRS.get(sd.name.lower())
            if split is None or not sd.is_dir():
                continue
            for img in sorted(p for p in sd.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png")):
                lf = folder / "labels" / sd.name / (img.stem + ".txt")
                new, ok = [], True
                for line in (lf.read_text().splitlines() if lf.exists() else []):
                    parts = line.split()
                    if len(parts) < 5:
                        continue
                    c = mapping.get(int(parts[0]))
                    if c is None:
                        ok = False
                        skipped[f"{folder.name}:{src_names[int(parts[0])]}"] += 1
                        break
                    new.append(f"{c} " + " ".join(parts[1:5]))
                if not ok:
                    continue
                stem = f"{folder.name}_{img.stem}"
                shutil.copy(img, out / "images" / split / (stem + img.suffix.lower()))
                (out / "labels" / split / (stem + ".txt")).write_text("\n".join(new))
                imgs_kept[split] += 1
                for line in new:
                    counts[split][names[int(line.split()[0])]] += 1

    yaml = f"path: {out.resolve()}\ntrain: images/train\nval: images/val\ntest: images/test\nnames:\n"
    yaml += "".join(f"  {i}: {n}\n" for i, n in enumerate(names))
    (out / "unified.yaml").write_text(yaml)
    (out / "merge_report.json").write_text(json.dumps(
        {"images": imgs_kept, "boxes": {s: dict(c) for s, c in counts.items()}, "skipped_by_class": dict(skipped)}, indent=2))
    print()
    for s in counts:
        print(f"{s}: {imgs_kept[s]} images, boxes {dict(counts[s])}")
    if skipped:
        print("skipped images because of unused classes (count of first offending label):", dict(skipped))
    print("wrote", out / "unified.yaml")


if __name__ == "__main__":
    main()
