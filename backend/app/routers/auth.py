from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import create_access_token, get_current_user, hash_password, require_role, verify_password
from ..db import get_db
from ..models import AuditLog, User, UserRole
from ..schemas import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    norm_email = payload.email.lower()

    # 1. Primary: Verify credentials via Supabase GoTrue Auth
    from ..config import get_settings
    import requests
    import uuid

    settings = get_settings()
    supabase_url = settings.supabase_url.rstrip("/")
    service_key = settings.supabase_service_key

    if supabase_url and service_key:
        try:
            res = requests.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                headers={"apikey": service_key, "Content-Type": "application/json"},
                json={"email": norm_email, "password": payload.password},
                timeout=6,
            )
            if res.status_code == 200:
                data = res.json()
                u_obj = data.get("user", {})
                role_str = u_obj.get("app_metadata", {}).get("role") or u_obj.get("user_metadata", {}).get("role") or "engineer"
                matched_role = UserRole.engineer
                for r in UserRole:
                    if r.value == role_str.lower():
                        matched_role = r
                        break
                uid_str = u_obj.get("id")
                uid = uuid.UUID(uid_str) if uid_str else uuid.uuid4()

                # Ensure user exists in local table for audit logs / inspection references
                user = db.scalar(select(User).where(User.email == norm_email))
                if not user:
                    user = User(
                        id=uid,
                        email=norm_email,
                        password_hash="supabase_auth",
                        role=matched_role,
                        is_active=True,
                    )
                    db.add(user)
                    db.commit()

                db.add(AuditLog(
                    user_id=user.id,
                    user_email=user.email,
                    action="LOGIN",
                    entity="user",
                    entity_id=str(user.id),
                    description=f"User {user.email} signed in via Supabase Auth",
                ))
                db.commit()

                return TokenResponse(
                    access_token=data.get("access_token"),
                    role=matched_role,
                    user_id=user.id,
                    email=user.email,
                )
        except Exception:
            pass

    # 2. Fallback: Local database check
    user = db.scalar(select(User).where(User.email == norm_email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated. Contact an administrator.")

    db.add(AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="LOGIN",
        entity="user",
        entity_id=str(user.id),
        description=f"User {user.email} signed in successfully",
    ))
    db.commit()

    return TokenResponse(
        access_token=create_access_token(user),
        role=user.role,
        user_id=user.id,
        email=user.email,
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(UserRole.admin))):
    if db.scalar(select(User).where(User.email == payload.email.lower())):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password), role=payload.role)
    db.add(user)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="USER_CREATED",
        entity="user",
        entity_id=str(user.id),
        description=f"Admin {current_user.email} created user {user.email} with role {user.role.value}",
    ))
    db.commit()
    db.refresh(user)
    return user
