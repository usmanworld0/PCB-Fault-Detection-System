import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import hash_password, require_role
from ..db import get_db
from ..models import AuditLog, User, UserRole
from ..schemas import UserAdminView, UserCreateAdmin, UserUpdateAdmin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserAdminView])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.admin)),
):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return users


@router.post("", response_model=UserAdminView, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=True,
    )
    db.add(user)
    db.flush()

    db.add(
        AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="USER_CREATED",
            entity="user",
            entity_id=str(user.id),
            description=f"Admin {current_user.email} created user {user.email} with role {user.role.value}",
        )
    )
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserAdminView)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = []
    if payload.role is not None and payload.role != user.role:
        old_role = user.role.value
        user.role = payload.role
        changes.append(f"role from {old_role} to {payload.role.value}")

    if payload.is_active is not None and payload.is_active != user.is_active:
        user.is_active = payload.is_active
        changes.append(f"status to {'Active' if payload.is_active else 'Deactivated'}")

    if changes:
        action = "ROLE_CHANGED" if payload.role is not None else "USER_UPDATED"
        db.add(
            AuditLog(
                user_id=current_user.id,
                user_email=current_user.email,
                action=action,
                entity="user",
                entity_id=str(user.id),
                description=f"Admin {current_user.email} updated {user.email}: {', '.join(changes)}",
            )
        )
        db.commit()
        db.refresh(user)

    return user
