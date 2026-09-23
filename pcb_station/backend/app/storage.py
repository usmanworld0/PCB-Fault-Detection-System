from fastapi import UploadFile
from supabase import create_client

from .config import get_settings


def upload_file(file: UploadFile, key: str) -> str:
    settings = get_settings()
    client = create_client(settings.supabase_url, settings.supabase_service_key)
    content = file.file.read()
    client.storage.from_(settings.supabase_bucket).upload(
        key, content, {"content-type": file.content_type or "image/jpeg", "upsert": "false"})
    return client.storage.from_(settings.supabase_bucket).get_public_url(key)
