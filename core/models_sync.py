"""Upload locally evaluated model metrics to the PCB Vision backend."""
import json
import os
from pathlib import Path

import requests

MODELS_DIR = Path("models")


def sync_models():
    """Reads immediate models/<name>/metrics.json files and posts them to /models/ingest."""
    api = os.environ.get("PCB_API_URL", "").rstrip("/")
    if not api:
        return 0, 0, "PCB_API_URL is not set"
    token = os.environ.get("PCB_API_TOKEN")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    sent = failed = 0
    if not MODELS_DIR.exists():
        return 0, 0, "models directory is missing"
    for model_dir in MODELS_DIR.iterdir():
        if not model_dir.is_dir() or not (model_dir / "metrics.json").is_file():
            continue
        try:
            metrics = json.loads((model_dir / "metrics.json").read_text(encoding="utf-8"))
            if not isinstance(metrics, dict):
                raise ValueError("metrics JSON must be an object")
            payload = {"name": model_dir.name, **metrics}
            if not payload.get("arch"):
                payload["arch"] = model_dir.name
            response = requests.post(f"{api}/models/ingest", headers=headers, json=payload, timeout=10)
            if response.ok:
                sent += 1
            else:
                failed += 1
        except (OSError, ValueError, json.JSONDecodeError, requests.RequestException):
            failed += 1
    return sent, failed, "done"
