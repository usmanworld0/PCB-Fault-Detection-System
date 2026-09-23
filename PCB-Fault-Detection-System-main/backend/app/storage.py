import os
from pathlib import Path
from fastapi import UploadFile
import httpx

from .config import get_settings


def upload_file(file: UploadFile, key: str) -> str:
    settings = get_settings()
    content = file.file.read()

    # If Supabase credentials are configured, upload to Supabase Storage
    if settings.supabase_url and settings.supabase_service_key and not settings.supabase_url.startswith("https://xxxx"):
        try:
            url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/{settings.supabase_bucket}/{key}"
            headers = {
                "apikey": settings.supabase_service_key,
                "Authorization": f"Bearer {settings.supabase_service_key}",
                "Content-Type": file.content_type or "image/jpeg",
                "x-upsert": "true",
            }
            with httpx.Client(timeout=15.0) as client:
                res = client.post(url, headers=headers, content=content)
                if res.status_code not in (200, 201):
                    res = client.put(url, headers=headers, content=content)
                if res.status_code in (200, 201):
                    return f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_bucket}/{key}"
        except Exception:
            # Fall back to local storage if Supabase upload fails (e.g. network/offline)
            pass

    # Fallback to local file store
    upload_dir = Path(__file__).resolve().parent.parent / "static" / "uploads"
    target = upload_dir / key
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "wb") as f:
        f.write(content)
    return f"/static/uploads/{key}"
