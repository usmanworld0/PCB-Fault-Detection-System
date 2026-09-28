"""Authentication and Role-Based Access Control for PCB-Vision Inspection Stations.
Validates operator credentials natively against Supabase Authentication (GoTrue / auth.users)
with automatic fallback to database records and resilient offline local SQLite session caching.
"""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sqlite3
import requests

from passlib.context import CryptContext

from .sync import _load_env_credentials

_load_env_credentials()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

BASE = Path(__file__).resolve().parent.parent / "data"
DB_PATH = BASE / "station.db"


def _init_local_auth_cache():
    BASE.mkdir(exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS local_auth_cache (
                email TEXT PRIMARY KEY,
                user_id TEXT,
                role TEXT,
                cached_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS active_session (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                email TEXT,
                user_id TEXT,
                role TEXT,
                logged_in_at TEXT,
                access_token TEXT
            )
        """)
        # Migration: ensure access_token column exists in active_session
        try:
            conn.execute("ALTER TABLE active_session ADD COLUMN access_token TEXT")
        except Exception:
            pass


def verify_password_hash(plain_password: str, password_hash: str) -> bool:
    """Verifies plain password strictly against bcrypt hash."""
    if not password_hash or not plain_password:
        return False
    if password_hash.startswith("$2"):
        try:
            return pwd_context.verify(plain_password, password_hash)
        except Exception:
            return False
    return False


def authenticate_station_user(email: str, password: str) -> dict:
    """Authenticates operator against Supabase Native Auth (auth.users).
    Supports automatic legacy migration from public.users and offline caching.
    Returns user dict: {'id': str, 'email': str, 'role': str, 'is_active': bool, 'token': str}.
    Raises ValueError or PermissionError on authentication failure.
    """
    _init_local_auth_cache()
    norm_email = email.strip().lower()
    if not norm_email or not password:
        raise ValueError("Email and password are required.")

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
    station_id = os.environ.get("PCB_STATION_ID", "STATION-01")

    # 1. Primary: Authenticate natively via Supabase GoTrue Auth service
    if supabase_url and supabase_key:
        auth_url = f"{supabase_url}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": supabase_key,
            "Content-Type": "application/json",
        }
        try:
            res = requests.post(
                auth_url,
                headers=headers,
                json={"email": norm_email, "password": password},
                timeout=10,
            )

            if res.status_code == 200:
                data = res.json()
                user_obj = data.get("user", {})
                user_id = user_obj.get("id", "")
                access_token = data.get("access_token", "")

                app_meta = user_obj.get("app_metadata", {})
                user_meta = user_obj.get("user_metadata", {})
                role = (app_meta.get("role") or user_meta.get("role") or "engineer").lower()

                # Cache in SQLite for offline station resiliency
                _cache_session_locally(norm_email, user_id, role, access_token)

                # Log audit event
                _log_auth_event(supabase_url, supabase_key, station_id, user_id, norm_email, role)

                return {
                    "id": user_id,
                    "email": norm_email,
                    "role": role,
                    "is_active": True,
                    "token": access_token,
                }
            elif res.status_code in (400, 401):
                err_data = {}
                try:
                    err_data = res.json()
                except Exception:
                    pass
                msg = (err_data.get("msg") or err_data.get("error_description") or err_data.get("error") or "").lower()
                
                # If credentials failed, check if user exists in public.users to auto-provision
                legacy_user = _attempt_legacy_public_users_fallback(
                    supabase_url, supabase_key, norm_email, password, station_id
                )
                if legacy_user:
                    return legacy_user
                
                raise ValueError("Access Denied: Invalid email or password.")
            else:
                raise ValueError(f"Supabase Authentication error (HTTP {res.status_code}).")
        except (ValueError, PermissionError):
            raise
        except (requests.ConnectionError, requests.Timeout):
            # Network issue: fall through to offline local cache
            pass

    # 2. Local fallback ONLY if network is completely unreachable (offline station operation)
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT user_id, role FROM local_auth_cache WHERE email = ?",
            (norm_email,),
        ).fetchone()
        if row:
            user_id, role = row
            return {
                "id": user_id,
                "email": norm_email,
                "role": role,
                "is_active": True,
                "token": "",
            }

    raise ValueError(
        "Could not verify credentials with Supabase Authentication. "
        "Check network connection or ensure your account is registered in Supabase."
    )


def _attempt_legacy_public_users_fallback(supabase_url, supabase_key, norm_email, password, station_id):
    """Checks public.users table and automatically provisions into native Supabase Auth."""
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }
    try:
        res = requests.get(
            f"{supabase_url}/rest/v1/users?email=eq.{norm_email}",
            headers=headers,
            timeout=8,
        )
        if res.status_code == 200:
            users = res.json()
            if not users:
                return None
            u = users[0]
            if not u.get("is_active", True):
                raise PermissionError(f"Access Denied: Account '{norm_email}' is deactivated.")

            if not verify_password_hash(password, u.get("password_hash", "")):
                return None

            user_id = u.get("id", "")
            role = (u.get("role") or "engineer").lower()

            # Auto-provision into native Supabase Auth
            try:
                requests.post(
                    f"{supabase_url}/auth/v1/admin/users",
                    headers=headers,
                    json={
                        "email": norm_email,
                        "password": password,
                        "email_confirm": True,
                        "user_metadata": {"role": role},
                        "app_metadata": {"role": role, "provider": "email"},
                    },
                    timeout=5,
                )
            except Exception:
                pass

            _cache_session_locally(norm_email, user_id, role, "")
            _log_auth_event(supabase_url, supabase_key, station_id, user_id, norm_email, role)

            return {
                "id": user_id,
                "email": norm_email,
                "role": role,
                "is_active": True,
                "token": "",
            }
    except (ValueError, PermissionError):
        raise
    except Exception:
        pass
    return None


def _cache_session_locally(norm_email: str, user_id: str, role: str, token: str):
    """Saves session in local station SQLite database."""
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO local_auth_cache (email, user_id, role, cached_at) VALUES (?, ?, ?, ?)",
                (norm_email, user_id, role, now_iso),
            )
            conn.execute(
                "INSERT OR REPLACE INTO active_session (id, email, user_id, role, logged_in_at, access_token) VALUES (1, ?, ?, ?, ?, ?)",
                (norm_email, user_id, role, now_iso, token),
            )
    except Exception:
        pass


def _log_auth_event(supabase_url, supabase_key, station_id, user_id, norm_email, role):
    """Sends authentication audit log entry to Supabase."""
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }
    try:
        requests.post(
            f"{supabase_url}/rest/v1/audit_logs",
            headers=headers,
            json={
                "user_id": user_id,
                "user_email": norm_email,
                "action": "LOGIN",
                "entity": "station",
                "entity_id": station_id,
                "description": f"Operator {norm_email} ({role.upper()}) authenticated at station {station_id}",
            },
            timeout=5,
        )
    except Exception:
        pass


def get_active_session() -> dict | None:
    """Returns currently saved station operator session or None."""
    _init_local_auth_cache()
    try:
        with sqlite3.connect(DB_PATH) as conn:
            row = conn.execute("SELECT email, user_id, role, logged_in_at, access_token FROM active_session WHERE id = 1").fetchone()
            if row:
                return {
                    "email": row[0],
                    "id": row[1],
                    "role": row[2],
                    "is_active": True,
                    "logged_in_at": row[3],
                    "token": row[4] if len(row) > 4 else "",
                }
    except Exception:
        pass
    return None


def clear_active_session():
    """Clears the active operator session (Sign Out)."""
    _init_local_auth_cache()
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute("DELETE FROM active_session WHERE id = 1")
    except Exception:
        pass


def check_role_permission(role: str, action: str) -> bool:
    """Checks role-based access permissions:
    - admin: all actions ('save', 'sync', 'sync_models', 'inspect')
    - engineer: 'save', 'sync', 'inspect'
    - viewer: 'inspect' only
    """
    role = (role or "viewer").lower()
    if role == "admin":
        return True
    if role == "engineer":
        return action in ("save", "sync", "inspect")
    if role == "viewer":
        return action == "inspect"
    return False


def validate_strong_password(password: str) -> tuple[bool, str]:
    """Validates password against strong password security criteria:
    - Min 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character
    """
    import re
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one numeric digit (0-9)."
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", password):
        return False, "Password must contain at least one special character (!@#$%...)."
    return True, ""


def request_password_reset(email: str) -> bool:
    """Requests a password recovery email from Supabase Auth GoTrue service."""
    norm_email = email.strip().lower()
    if not norm_email:
        raise ValueError("Please provide a valid operator email address.")

    supabase_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")

    if not supabase_url or not supabase_key:
        raise ValueError("Supabase connection parameters are not configured.")

    recover_url = f"{supabase_url}/auth/v1/recover"
    headers = {
        "apikey": supabase_key,
        "Content-Type": "application/json",
    }
    try:
        res = requests.post(recover_url, headers=headers, json={"email": norm_email}, timeout=10)
        if res.status_code in (200, 204):
            return True
        else:
            err_data = {}
            try:
                err_data = res.json()
            except Exception:
                pass
            msg = err_data.get("msg") or err_data.get("error_description") or f"HTTP {res.status_code}"
            raise ValueError(f"Supabase password reset failed: {msg}")
    except requests.RequestException as e:
        raise ConnectionError(f"Network error communicating with Supabase: {e}")

