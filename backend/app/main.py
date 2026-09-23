from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .auth import hash_password
from .config import get_settings
from .db import Base, SessionLocal, engine
from .models import User, UserRole
from .routers import auth, inspections, models_router, stats


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    settings = get_settings()
    with SessionLocal() as db:
        if db.scalar(select(User.id).limit(1)) is None:
            db.add(User(email=settings.admin_email.lower(), password_hash=hash_password(settings.admin_password), role=UserRole.admin))
            db.commit()
    yield


app = FastAPI(title="PCB Vision API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_origin_list, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)
app.include_router(inspections.router)
app.include_router(models_router.router)
app.include_router(stats.router)
