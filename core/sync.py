"""Direct Supabase and REST Cloud Synchronization for PCB-Vision Stations.
Uploads saved local inspection images directly to Supabase Storage ('pcb-vision')
and registers inspection and defect records in Supabase PostgreSQL via PostgREST.
Zero cloud server / zero backend required!
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import uuid
import requests

from . import store

# Try to load credentials from backend/.env if available
def _load_env_credentials():
    env_paths = [
        Path(__file__).resolve().parent.parent / "backend" / ".env",
        Path(__file__).resolve().parent.parent / ".env",
    ]
    for p in env_paths:
        if p.exists():
            for line in p.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
            break

_load_env_credentials()


def _resolve_image_path(p: str) -> Path:
    path = Path(p)
    if path.is_file():
        return path
    alt = Path(__file__).resolve().parent.parent / "data" / "images" / path.name
    if alt.is_file():
        return alt
    alt2 = Path(__file__).resolve().parent.parent / "data" / path.name
    if alt2.is_file():
        return alt2
    return path


def _upload_to_supabase_storage(supabase_url: str, key: str, bucket: str, file_path: str, remote_name: str) -> str:
    resolved_path = _resolve_image_path(file_path)
    url = f"{supabase_url.rstrip('/')}/storage/v1/object/{bucket}/{remote_name}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "x-upsert": "true",
        "Content-Type": "image/jpeg",
    }
    with open(resolved_path, "rb") as f:
        content = f.read()

    res = requests.post(url, headers=headers, data=content, timeout=20)
    if res.status_code not in (200, 201):
        # Retry with PUT
        res = requests.put(url, headers=headers, data=content, timeout=20)

    if res.status_code in (200, 201):
        return f"{supabase_url.rstrip('/')}/storage/v1/object/public/{bucket}/{remote_name}"
    raise RuntimeError(f"Storage upload failed: {res.status_code} {res.text}")


def sync_pending():
    """Syncs unsynced inspections directly to Supabase, with REST fallback.
    Returns (sent, failed, message).
    """
    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
    bucket = os.environ.get("SUPABASE_BUCKET", "pcb-vision")
    station_id = os.environ.get("PCB_STATION_ID", "STATION-01")

    # If Supabase credentials are available, sync directly to Supabase (Zero backend needed!)
    if supabase_url and supabase_key and not supabase_url.startswith("https://xxxx"):
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        sent = failed = 0

        for row_id, ts, source, result_json, img_p, ann_p in store.pending():
            try:
                # 1. Upload Images to Supabase Storage
                safe_name = Path(img_p).stem
                raw_remote = f"inspections/{row_id}_{safe_name}.jpg"
                ann_remote = f"inspections/{row_id}_{safe_name}_annotated.jpg"

                img_url = _upload_to_supabase_storage(supabase_url, supabase_key, bucket, img_p, raw_remote)
                ann_url = _upload_to_supabase_storage(supabase_url, supabase_key, bucket, ann_p, ann_remote)

                # 2. Parse Inspection Payload
                try:
                    data = json.loads(result_json) if isinstance(result_json, str) else (result_json or {})
                except Exception:
                    data = {}

                model_name = data.get("model", "yolov8s")
                status = (data.get("status") or "PASS").upper()
                detections = data.get("detections") or data.get("defects") or []
                defect_count = len(detections)

                # 3. Insert or Upsert Inspection in Supabase Postgres
                insp_id = str(uuid.uuid4())
                now_str = datetime.now(timezone.utc).isoformat()
                insp_payload = {
                    "id": insp_id,
                    "station_id": station_id,
                    "local_id": row_id,
                    "captured_at": ts,
                    "source": source,
                    "image_url": img_url,
                    "annotated_url": ann_url,
                    "model": model_name,
                    "status": status,
                    "review_status": "UNREVIEWED",
                    "final_status": status,
                    "created_at": now_str,
                }

                r_insp = requests.post(
                    f"{supabase_url}/rest/v1/inspections",
                    headers=headers,
                    json=insp_payload,
                    timeout=15,
                )

                if r_insp.status_code not in (200, 201):
                    # Check if duplicate local_id already exists (idempotency)
                    r_get = requests.get(
                        f"{supabase_url}/rest/v1/inspections?station_id=eq.{station_id}&local_id=eq.{row_id}",
                        headers=headers,
                        timeout=10,
                    )
                    if r_get.ok and r_get.json():
                        store.mark_synced(row_id)
                        sent += 1
                        continue
                    else:
                        print(f"[Sync Error] Supabase rejected inspection insert: {r_insp.status_code} {r_insp.text}")
                        failed += 1
                        continue

                created_insp = r_insp.json()
                cloud_insp_id = created_insp[0]["id"] if isinstance(created_insp, list) and created_insp else insp_id

                # 4. Insert Defects if any
                if cloud_insp_id and detections:
                    defect_rows = []
                    for d in detections:
                        cls_name = d.get("class", "defect")
                        conf = float(d.get("confidence", 0.9))
                        box = d.get("box", [0, 0, 0, 0])
                        # Classify severity
                        sev = "Critical" if cls_name in ("open", "short") else ("Moderate" if cls_name in ("mousebite", "spur") else "Minor")
                        defect_rows.append({
                            "id": str(uuid.uuid4()),
                            "inspection_id": cloud_insp_id,
                            "class": cls_name,
                            "confidence": conf,
                            "severity": sev,
                            "box_x1": float(box[0]) if len(box) > 0 else 0.0,
                            "box_y1": float(box[1]) if len(box) > 1 else 0.0,
                            "box_x2": float(box[2]) if len(box) > 2 else 0.0,
                            "box_y2": float(box[3]) if len(box) > 3 else 0.0,
                        })

                    if defect_rows:
                        requests.post(
                            f"{supabase_url}/rest/v1/defects",
                            headers=headers,
                            json=defect_rows,
                            timeout=15,
                        )

                # 5. Insert Notification on Anomaly
                if cloud_insp_id and (status == "FAIL" or defect_count > 0):
                    requests.post(
                        f"{supabase_url}/rest/v1/notifications",
                        headers=headers,
                        json={
                            "id": str(uuid.uuid4()),
                            "category": "Defect Alert",
                            "title": f"PCB Defect Detected ({station_id})",
                            "message": f"Found {defect_count} defect(s) on board image {source}",
                            "severity": "Critical" if any(d.get("class") in ("open", "short") for d in detections) else "Moderate",
                            "inspection_id": cloud_insp_id,
                            "is_read": False,
                            "created_at": now_str,
                        },
                        timeout=10,
                    )

                # 6. Mark Local SQLite Row as Synced
                store.mark_synced(row_id)
                sent += 1

            except Exception:
                failed += 1
                break  # network is down, pause and retry later

        return sent, failed, "Supabase direct sync completed"

    # Fallback to local REST API if PCB_API_URL is configured
    api = os.environ.get("PCB_API_URL", "").rstrip("/")
    if not api:
        return 0, 0, "Neither Supabase credentials nor PCB_API_URL configured."

    token = os.environ.get("PCB_API_TOKEN")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    sent = failed = 0
    for row_id, ts, source, result_json, img_p, ann_p in store.pending():
        try:
            with open(img_p, "rb") as f, open(ann_p, "rb") as g:
                r = requests.post(
                    f"{api}/inspections/ingest",
                    headers=headers,
                    timeout=15,
                    data={"captured_at": ts, "source": source, "result": result_json,
                          "station_id": station_id, "local_id": str(row_id)},
                    files={"image": f, "annotated": g},
                )
            if r.ok:
                store.mark_synced(row_id)
                sent += 1
            else:
                failed += 1
        except requests.RequestException:
            failed += 1
            break
    return sent, failed, "done"
