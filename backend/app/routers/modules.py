from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/modules", tags=["modules"])


def _to_schema(module: models.Module) -> schemas.ModuleOut:
    topics = sorted(module.topics, key=lambda t: t.order)
    return schemas.ModuleOut(
        id=module.id,
        name=module.name,
        description=module.description,
        topics=[schemas.TopicOut(id=t.key, name=t.name) for t in topics],
    )


def get_module_or_404(db: Session, module_id: str) -> models.Module:
    module = crud.get_module(db, module_id)
    if module is None:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return module


@router.get("", response_model=List[schemas.ModuleOut])
def list_modules(db: Session = Depends(get_db)):
    return [_to_schema(m) for m in crud.list_modules(db)]