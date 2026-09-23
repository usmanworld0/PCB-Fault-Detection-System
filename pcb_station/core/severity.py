# Severity rule. Edit the sets and thresholds to match what NCP considers critical.
CRITICAL_CLASSES = {"open", "short"}
HIGH_CONF = 0.6


def rate(cls_name: str, conf: float) -> str:
    if cls_name in CRITICAL_CLASSES:
        return "Critical" if conf >= HIGH_CONF else "Moderate"
    return "Moderate" if conf >= HIGH_CONF else "Minor"
