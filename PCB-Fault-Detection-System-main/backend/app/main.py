from contextlib import asynccontextmanager
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from .auth import hash_password
from .config import get_settings
from .db import Base, SessionLocal, engine
from .models import Model, User, UserRole
from .routers import audit, auth, inspections, models_router, notifications, reports, reviews, settings as settings_router, stats, users


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    settings = get_settings()
    with SessionLocal() as db:
        # Seed initial admin user if no users exist
        if db.scalar(select(User.id).limit(1)) is None:
            db.add(
                User(
                    email=settings.admin_email.lower(),
                    password_hash=hash_password(settings.admin_password),
                    role=UserRole.admin,
                    is_active=True,
                )
            )
            db.commit()

        # Seed models from filesystem if no models exist in database
        if db.scalar(select(Model.id).limit(1)) is None:
            models_dir = Path(__file__).resolve().parent.parent.parent / "models"
            if models_dir.exists():
                for model_dir in models_dir.iterdir():
                    metrics_path = model_dir / "metrics.json"
                    if model_dir.is_dir() and metrics_path.is_file():
                        try:
                            data = json.loads(metrics_path.read_text(encoding="utf-8"))
                            name = data.get("model", model_dir.name)
                            arch = "yolov8" if "yolo" in name.lower() else name
                            db.add(
                                Model(
                                    name=name,
                                    arch=arch,
                                    dataset=data.get("test_split", "DeepPCB"),
                                    map50=data.get("map50"),
                                    map50_95=data.get("map50_95"),
                                    precision=data.get("precision"),
                                    recall=data.get("recall"),
                                    f1=data.get("f1"),
                                    cpu_ms=data.get("gpu_inference_ms") or data.get("cpu_ms_median"),
                                    metrics_json=data,
                                )
                            )
                        except Exception:
                            pass
                db.commit()

    yield


app = FastAPI(title="PCB Vision API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for local uploads fallback
static_dir = Path(__file__).resolve().parent.parent / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Mount all routers
app.include_router(auth.router)
app.include_router(inspections.router)
app.include_router(models_router.router)
app.include_router(stats.router)
app.include_router(reviews.router)
app.include_router(users.router)
app.include_router(audit.router)
app.include_router(notifications.router)
app.include_router(reports.router)
app.include_router(settings_router.router)
