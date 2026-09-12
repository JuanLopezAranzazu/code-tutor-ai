from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from . import models


# ---------- Modulos y topics ----------

def list_modules(db: Session) -> List[models.Module]:
    return (
        db.query(models.Module)
        .options(joinedload(models.Module.topics))
        .order_by(models.Module.order)
        .all()
    )


def get_module(db: Session, module_id: str) -> Optional[models.Module]:
    return (
        db.query(models.Module)
        .options(joinedload(models.Module.topics))
        .filter(models.Module.id == module_id)
        .first()
    )


# ---------- Progreso ----------

def record_attempt(
    db: Session, user_id: UUID, module_id: str, correct: bool, score: int
) -> models.ModuleProgress:
    progress = (
        db.query(models.ModuleProgress)
        .filter(
            models.ModuleProgress.user_id == user_id,
            models.ModuleProgress.module_id == module_id,
        )
        .first()
    )
    if progress is None:
        progress = models.ModuleProgress(user_id=user_id, module_id=module_id)
        db.add(progress)

    progress.exercises_attempted += 1
    if correct:
        progress.exercises_correct += 1
    progress.total_score += score
    progress.last_activity = datetime.now(timezone.utc)

    db.commit()
    db.refresh(progress)
    return progress


def get_progress_for_user(db: Session, user_id: UUID):
    return (
        db.query(models.ModuleProgress)
        .filter(models.ModuleProgress.user_id == user_id)
        .all()
    )


# ---------- Chat del tutor ----------

def get_chat_history(
    db: Session, user_id: UUID, module_id: str, limit: Optional[int] = None
) -> List[models.ChatMessage]:
    query = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id,
        models.ChatMessage.module_id == module_id,
    )
    if limit:
        rows = query.order_by(models.ChatMessage.created_at.desc()).limit(limit).all()
        return list(reversed(rows))
    return query.order_by(models.ChatMessage.created_at.asc()).all()


def add_chat_message(
    db: Session, user_id: UUID, module_id: str, role: str, content: str
) -> models.ChatMessage:
    message = models.ChatMessage(
        user_id=user_id, module_id=module_id, role=role, content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def clear_chat_history(db: Session, user_id: UUID, module_id: str) -> None:
    db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == user_id,
        models.ChatMessage.module_id == module_id,
    ).delete()
    db.commit()