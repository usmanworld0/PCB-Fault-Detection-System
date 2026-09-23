"""Detection metrics in plain numpy, so every model (YOLO, Faster R-CNN, RetinaNet...) is scored
by exactly the same code. AP uses COCO style 101 point interpolation.

preds: list with one entry per image: (boxes [N,4] xyxy pixels, scores [N], classes [N] int)
gts:   list with one entry per image: (boxes [M,4] xyxy pixels, classes [M] int)
"""
import numpy as np

IOU_THRS = np.arange(0.5, 0.96, 0.05)


def read_yolo_labels(path, w, h):
    """YOLO txt -> (boxes xyxy in pixels, classes)."""
    boxes, cls = [], []
    p = path
    if p.exists():
        for line in p.read_text().splitlines():
            parts = line.split()
            if len(parts) < 5:
                continue
            c, cx, cy, bw, bh = int(parts[0]), *map(float, parts[1:5])
            boxes.append([(cx - bw / 2) * w, (cy - bh / 2) * h, (cx + bw / 2) * w, (cy + bh / 2) * h])
            cls.append(c)
    return np.array(boxes, np.float32).reshape(-1, 4), np.array(cls, np.int64)


def iou_matrix(a, b):
    if len(a) == 0 or len(b) == 0:
        return np.zeros((len(a), len(b)), np.float32)
    x1 = np.maximum(a[:, None, 0], b[None, :, 0]); y1 = np.maximum(a[:, None, 1], b[None, :, 1])
    x2 = np.minimum(a[:, None, 2], b[None, :, 2]); y2 = np.minimum(a[:, None, 3], b[None, :, 3])
    inter = np.clip(x2 - x1, 0, None) * np.clip(y2 - y1, 0, None)
    area_a = (a[:, 2] - a[:, 0]) * (a[:, 3] - a[:, 1])
    area_b = (b[:, 2] - b[:, 0]) * (b[:, 3] - b[:, 1])
    return inter / (area_a[:, None] + area_b[None, :] - inter + 1e-9)


def _ap(rec, prec):
    mrec = np.concatenate([[0.0], rec, [1.0]])
    mpre = np.concatenate([[1.0], prec, [0.0]])
    mpre = np.flip(np.maximum.accumulate(np.flip(mpre)))
    x = np.linspace(0, 1, 101)
    y = np.interp(x, mrec, mpre)
    return float(np.sum((y[1:] + y[:-1]) / 2 * np.diff(x)))


def _class_records(preds, gts, c):
    """Detections of class c sorted by score, with the IoU row against same-class GTs of that image."""
    dets = []
    n_gt = 0
    for i, ((pb, ps, pc), (gb, gc)) in enumerate(zip(preds, gts)):
        g = gb[gc == c]
        n_gt += len(g)
        sel = pc == c
        if not sel.any():
            continue
        ious = iou_matrix(pb[sel], g)
        for s, row in zip(ps[sel], ious):
            dets.append((float(s), i, row))
    dets.sort(key=lambda d: -d[0])
    return dets, n_gt


def _match(dets, gts_per_img_count, thr, min_score=0.0):
    """Greedy matching in score order. Returns tp flags for detections with score >= min_score."""
    matched = {i: np.zeros(n, bool) for i, n in gts_per_img_count.items()}
    tp = []
    for s, i, row in dets:
        if s < min_score:
            break
        if len(row) == 0:
            tp.append(0)
            continue
        r = np.where(matched[i], -1.0, row)
        j = int(np.argmax(r))
        if r[j] >= thr:
            matched[i][j] = True
            tp.append(1)
        else:
            tp.append(0)
    return np.array(tp, np.float64)


def evaluate(preds, gts, n_classes, conf_op=0.25):
    counts = [{i: int((gc == c).sum()) for i, (_, gc) in enumerate(gts)} for c in range(n_classes)]
    ap50, ap5095, prec_c, rec_c = {}, {}, {}, {}
    tp_tot = fp_tot = fn_tot = 0
    for c in range(n_classes):
        dets, n_gt = _class_records(preds, gts, c)
        if n_gt == 0:
            continue
        aps = []
        for k, thr in enumerate(IOU_THRS):
            tp = _match(dets, counts[c], thr)
            if len(tp) == 0:
                aps.append(0.0)
                continue
            ctp, cfp = np.cumsum(tp), np.cumsum(1 - tp)
            aps.append(_ap(ctp / n_gt, ctp / (ctp + cfp + 1e-9)))
            if k == 0:
                ap50[c] = aps[-1]
        ap50.setdefault(c, 0.0)
        ap5095[c] = float(np.mean(aps))
        tp = _match(dets, counts[c], 0.5, min_score=conf_op)
        t = int(tp.sum()); f = len(tp) - t
        prec_c[c] = t / (t + f) if (t + f) else 0.0
        rec_c[c] = t / n_gt
        tp_tot += t; fp_tot += f; fn_tot += n_gt - t
    P = float(np.mean(list(prec_c.values()))) if prec_c else 0.0
    R = float(np.mean(list(rec_c.values()))) if rec_c else 0.0
    out = {
        "map50": float(np.mean(list(ap50.values()))) if ap50 else 0.0,
        "map50_95": float(np.mean(list(ap5095.values()))) if ap5095 else 0.0,
        "precision": P, "recall": R, "f1": 2 * P * R / (P + R + 1e-9),
        "operating_conf": conf_op, "tp": tp_tot, "fp": fp_tot, "fn": fn_tot,
        "per_class_map50": {int(c): v for c, v in ap50.items()},
        "per_class_map50_95": {int(c): v for c, v in ap5095.items()},
    }
    out.update(image_level_roc(preds, gts))
    return out


def image_level_roc(preds, gts):
    """Score of an image = its highest detection confidence. Label = image has a real defect."""
    scores = np.array([float(ps.max()) if len(ps) else 0.0 for _, ps, _ in preds])
    labels = np.array([len(gc) > 0 for _, gc in gts])
    pos, neg = scores[labels], scores[~labels]
    if len(pos) == 0 or len(neg) == 0:
        return {"auc_image": None, "roc_image": None}
    ns = np.sort(neg)
    auc = float((((np.searchsorted(ns, pos, "left") + np.searchsorted(ns, pos, "right")) / 2).sum())
                / (len(pos) * len(neg)))
    thr = np.unique(np.concatenate([[0.0, 1.01], scores]))[::-1]
    if len(thr) > 120:
        thr = thr[np.linspace(0, len(thr) - 1, 120).astype(int)]
    tpr = [float((pos >= t).mean()) for t in thr]
    fpr = [float((neg >= t).mean()) for t in thr]
    return {"auc_image": auc, "roc_image": {"fpr": [round(x, 4) for x in fpr], "tpr": [round(x, 4) for x in tpr]}}
