"""Uploads saved inspections to the backend. Set PCB_API_URL, e.g. http://localhost:8000
The backend needs an endpoint that accepts an image plus the detections (not one that
runs the model again). Adjust the URL path and fields below to match your API."""
import os

import requests

from . import store


def sync_pending():
    """Returns (sent, failed, message)."""
    api = os.environ.get("PCB_API_URL", "").rstrip("/")
    if not api:
        return 0, 0, "PCB_API_URL is not set"
    token = os.environ.get("PCB_API_TOKEN")
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    sent = failed = 0
    station_id = os.environ.get("PCB_STATION_ID", "STATION-01")
    for row_id, ts, source, result_json, img_p, ann_p in store.pending():
        try:
            with open(img_p, "rb") as f, open(ann_p, "rb") as g:
                r = requests.post(
                    f"{api}/inspections/ingest", headers=headers, timeout=10,
                    data={"captured_at": ts, "source": source, "result": result_json,
                          "station_id": station_id, "local_id": str(row_id)},
                    files={"image": f, "annotated": g})
            if r.ok:
                store.mark_synced(row_id)
                sent += 1
            else:
                failed += 1
        except requests.RequestException:
            failed += 1
            break  # network is down, stop and try later
    return sent, failed, "done"
