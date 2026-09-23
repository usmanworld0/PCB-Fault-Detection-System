from fastapi import APIRouter, Depends
from sqlalchemy import nulls_last, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..db import get_db
from ..models import Model, User
from ..schemas import ModelIngest, ModelResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.post("/ingest", response_model=ModelResponse)
def ingest_model(payload: ModelIngest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    values = payload.model_dump(mode="json")
    metrics = {**values, **(payload.model_extra or {})}
    model = db.scalar(select(Model).where(Model.name == payload.name))
    if model is None:
        model = Model(name=payload.name, arch=payload.arch, dataset=payload.dataset, metrics_json=metrics)
        db.add(model)
    else:
        model.arch, model.dataset, model.metrics_json = payload.arch, payload.dataset, metrics
    for field, metric in (("map50", "map50"), ("map50_95", "map50_95"), ("precision", "precision"),
                          ("recall", "recall"), ("f1", "f1"), ("cpu_ms", "cpu_ms_median")):
        value = metrics.get(metric)
        setattr(model, field, float(value) if value is not None else None)
    db.commit()
    db.refresh(model)
    return model


@router.get("", response_model=list[ModelResponse])
def list_models(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Model).order_by(nulls_last(Model.map50.desc()), Model.name)).all()
