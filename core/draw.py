import cv2

COLORS = {  # BGR
    "Critical": (0, 0, 220),
    "Moderate": (0, 140, 255),
    "Minor": (0, 200, 0),
}


def draw_detections(bgr, detections):
    out = bgr.copy()
    h, w = out.shape[:2]
    scale = max(0.4, min(w, h) / 900)
    thick = max(1, int(round(min(w, h) / 400)))
    for d in detections:
        x1, y1, x2, y2 = [int(v) for v in d.box]
        color = COLORS.get(d.severity, (255, 0, 0))
        cv2.rectangle(out, (x1, y1), (x2, y2), color, thick)
        label = f"{d.cls} {d.conf:.2f}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, scale, thick)
        ty = y1 - 4 if y1 - th - 6 > 0 else y2 + th + 4
        cv2.rectangle(out, (x1, ty - th - 4), (x1 + tw + 4, ty + 2), color, -1)
        cv2.putText(out, label, (x1 + 2, ty - 2), cv2.FONT_HERSHEY_SIMPLEX,
                    scale, (255, 255, 255), thick, cv2.LINE_AA)
    return out
