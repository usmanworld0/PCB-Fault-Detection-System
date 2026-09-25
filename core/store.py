"""Local inspection history in SQLite. Works offline. sync.py uploads pending rows later."""
from datetime import datetime
import json
from pathlib import Path
import sqlite3

import cv2

BASE = Path(__file__).resolve().parent.parent / "data"
DB_PATH = BASE / "station.db"
IMG_DIR = BASE / "images"


def _conn():
    BASE.mkdir(exist_ok=True)
    IMG_DIR.mkdir(exist_ok=True)
    c = sqlite3.connect(DB_PATH)
    c.execute("""CREATE TABLE IF NOT EXISTS inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, source TEXT, model TEXT, status TEXT, defect_count INTEGER,
        image_path TEXT, annotated_path TEXT, result_json TEXT, synced INTEGER DEFAULT 0,
        operator_email TEXT, operator_role TEXT)""")

    # Ensure operator columns exist in existing SQLite databases
    cursor = c.cursor()
    cursor.execute("PRAGMA table_info(inspections)")
    existing_cols = {col[1] for col in cursor.fetchall()}
    if "operator_email" not in existing_cols:
        c.execute("ALTER TABLE inspections ADD COLUMN operator_email TEXT")
    if "operator_role" not in existing_cols:
        c.execute("ALTER TABLE inspections ADD COLUMN operator_role TEXT")

    return c


def save(frame, annotated, result, source_name, operator_email: str | None = None, operator_role: str | None = None):
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now()
    stem = ts.strftime("%Y%m%d_%H%M%S_%f")
    img_p, ann_p = IMG_DIR / f"{stem}.jpg", IMG_DIR / f"{stem}_annotated.jpg"
    if not (cv2.imwrite(str(img_p), frame) and cv2.imwrite(str(ann_p), annotated)):
        raise IOError(f"Could not write images to {IMG_DIR}")
    with _conn() as c:
        cur = c.execute(
            "INSERT INTO inspections (ts, source, model, status, defect_count, image_path,"
            " annotated_path, result_json, operator_email, operator_role) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (ts.isoformat(), source_name, result.model, result.status, len(result.detections),
             str(img_p), str(ann_p), json.dumps(result.to_dict()), operator_email, operator_role))
        return cur.lastrowid


def pending():
    with _conn() as c:
        return c.execute("SELECT id, ts, source, result_json, image_path, annotated_path, operator_email, operator_role"
                         " FROM inspections WHERE synced = 0").fetchall()


def mark_synced(row_id):
    with _conn() as c:
        c.execute("UPDATE inspections SET synced = 1 WHERE id = ?", (row_id,))


def count():
    with _conn() as c:
        total = c.execute("SELECT COUNT(*) FROM inspections").fetchone()[0]
        unsynced = c.execute("SELECT COUNT(*) FROM inspections WHERE synced = 0").fetchone()[0]
    return total, unsynced
