"""Upload locally evaluated model metrics to Supabase or the PCB Vision backend."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import uuid
import requests

from core.sync import _load_env_credentials

_load_env_credentials()

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def sync_models():
    """Reads models/<name>/metrics.json files and syncs them to Supabase or REST backend."""
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")

    if not MODELS_DIR.exists():
        return 0, 0, "models directory is missing"

    model_files = [d for d in MODELS_DIR.iterdir() if d.is_dir() and (d / "metrics.json").is_file()]
    if not model_files:
        return 0, 0, "no model metrics found"

    if supabase_url and supabase_key and not supabase_url.startswith("https://xxxx"):
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        }
        sent = failed = 0
        now_str = datetime.now(timezone.utc).isoformat()
        for model_dir in model_files:
            try:
                metrics = json.loads((model_dir / "metrics.json").read_text(encoding="utf-8"))
                if not isinstance(metrics, dict):
                    continue
                name = model_dir.name
                payload = {
                    "id": str(uuid.uuid4()),
                    "name": name,
                    "arch": metrics.get("arch", name),
                    "dataset": metrics.get("dataset", "DeepPCB"),
                    "map50": metrics.get("mAP50", metrics.get("map50")),
                    "map50_95": metrics.get("mAP50_95", metrics.get("map50_95")),
                    "precision": metrics.get("precision"),
                    "recall": metrics.get("recall"),
                    "f1": metrics.get("f1"),
                    "cpu_ms": metrics.get("latency_ms", metrics.get("cpu_ms")),
                    "metrics_json": metrics,
                    "uploaded_at": now_str,
                }
                r = requests.post(
                    f"{supabase_url}/rest/v1/models?on_conflict=name",
                    headers=headers,
                    json=payload,
                    timeout=10,
                )
                if r.status_code in (200, 201):
                    sent += 1
                else:
                    failed += 1
            except Exception:
                failed += 1
        return sent, failed, "Supabase model sync completed"

    api = os.environ.get("PCB_API_URL", "").rstrip("/")
    if not api:
        return 0, 0, "Neither Supabase credentials nor PCB_API_URL configured."
    token = os.environ.get("PCB_API_TOKEN")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    sent = failed = 0
    for model_dir in model_files:
        try:
            metrics = json.loads((model_dir / "metrics.json").read_text(encoding="utf-8"))
            payload = {"name": model_dir.name, **metrics}
            if not payload.get("arch"):
                payload["arch"] = model_dir.name
            response = requests.post(f"{api}/models/ingest", headers=headers, json=payload, timeout=10)
            if response.ok:
                sent += 1
            else:
                failed += 1
        except Exception:
            failed += 1
    return sent, failed, "done"

