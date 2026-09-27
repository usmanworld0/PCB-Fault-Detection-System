from datetime import datetime, timedelta, timezone
from typing import Callable
import uuid

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .models import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user: User) -> str:
    settings = get_settings()
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    return jwt.encode(
        {"sub": str(user.id), "email": user.email, "role": user.role.value, "exp": expires},
        settings.jwt_secret,
        algorithm="HS256",
    )


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = credentials.credentials
    user = None

    # 1. Try local HS256 decoding with jwt_secret
    try:
        payload = jwt.decode(token, get_settings().jwt_secret, algorithms=["HS256"])
        sub = payload.get("sub")
        user_id = uuid.UUID(sub) if isinstance(sub, str) else sub
        user = db.get(User, user_id)
    except (jwt.PyJWTError, ValueError):
        pass

    # 2. Try Supabase JWT decoding (GoTrue tokens)
    if user is None:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            email = payload.get("email")
            if email:
                user = db.query(User).filter(User.email == email.lower()).first()
                if not user:
                    role_str = payload.get("app_metadata", {}).get("role") or payload.get("user_metadata", {}).get("role") or "engineer"
                    matched_role = UserRole.engineer
                    for r in UserRole:
                        if r.value == role_str.lower():
                            matched_role = r
                            break
                    sub_str = payload.get("sub")
                    uid = uuid.UUID(sub_str) if sub_str else uuid.uuid4()
                    user = User(
                        id=uid,
                        email=email.lower(),
                        password_hash="supabase_auth",
                        role=matched_role,
                        is_active=True,
                    )
                    db.add(user)
                    db.commit()
        except Exception:
            pass

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    return user


def require_role(*roles: UserRole) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user
    return dependency
