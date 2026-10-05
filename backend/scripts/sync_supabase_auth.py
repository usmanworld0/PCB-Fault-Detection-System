"""Sync and Provision Users into native Supabase Authentication (auth.users).
Migrates existing users from public.users table into Supabase GoTrue Auth service.
"""
import os
import sys
from pathlib import Path
import requests

# Load environment credentials
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
if not ENV_FILE.exists():
    ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

if ENV_FILE.exists():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

if not SUPABASE_URL or not SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured in .env")
    sys.exit(1)

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}


def sync_users():
    print(f"Connecting to Supabase at: {SUPABASE_URL}")

    # 1. Fetch existing users in auth.users
    auth_users_res = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers, timeout=10)
    existing_auth_emails = set()
    if auth_users_res.status_code == 200:
        for u in auth_users_res.json().get("users", []):
            existing_auth_emails.add(u.get("email", "").lower())
    print(f"Current users in Supabase Auth (auth.users): {len(existing_auth_emails)}")

    # 2. Fetch users in public.users table
    public_res = requests.get(f"{SUPABASE_URL}/rest/v1/users?select=*", headers=headers, timeout=10)
    public_users = []
    if public_res.status_code == 200:
        public_users = public_res.json()
    print(f"Current users in Database table (public.users): {len(public_users)}")

    # Default seeds if public.users was empty
    if not public_users:
        admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "world.usman.business@gmail.com")
        public_users = [
            {"email": admin_email, "role": "admin"},
        ]

    # 3. Provision into Supabase Auth
    synced_count = 0
    for u in public_users:
        email = u.get("email", "").strip().lower()
        role = (u.get("role") or "engineer").lower()
        if not email:
            continue

        if email in existing_auth_emails:
            print(f"  [ALREADY PRESENT] {email} (role: {role})")
            continue

        pwd = ADMIN_PASSWORD or os.environ.get("DEFAULT_USER_PASSWORD", "TemporaryPcb2026!Secure")
        payload = {
            "email": email,
            "password": pwd,
            "email_confirm": True,
            "user_metadata": {"role": role},
            "app_metadata": {"role": role, "provider": "email"},
        }

        res = requests.post(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers, json=payload, timeout=10)
        if res.status_code in (200, 201):
            print(f"  [PROVISIONED] Successfully added {email} (role: {role}) to Supabase Auth!")
            synced_count += 1
        else:
            print(f"  [FAILED] Could not add {email}: {res.status_code} - {res.text[:120]}")

    print(f"\nDone! Successfully provisioned {synced_count} user(s) into Supabase Authentication.")


if __name__ == "__main__":
    sync_users()
