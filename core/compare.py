"""Run all loaded production detectors against one image."""
from collections import Counter


def _metric(metrics, name):
    value = metrics.get(name) if isinstance(metrics, dict) else None
    return float(value) if isinstance(value, (int, float)) else 0.0


def compare_all(models: dict, bgr, conf=0.25) -> list[dict]:
    """Return one measured comparison row for every non-demo model."""
    rows = []
    for label, loader in models.items():
        detector = loader()
        if detector.name == "Demo (no model)":
            continue
        result = detector.predict(bgr, conf)
        counts = Counter(d.cls for d in result.detections)
        top_class = counts.most_common(1)[0][0] if counts else "-"
        metrics = getattr(detector, "_metrics", {})
        rows.append({"model": detector.name, "defects": len(result.detections), "top_class": top_class,
                     "status": result.status, "ms": result.ms, "map50": _metric(metrics, "map50"),
                     "precision": _metric(metrics, "precision"), "recall": _metric(metrics, "recall")})
    return rows
