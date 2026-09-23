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
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
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
