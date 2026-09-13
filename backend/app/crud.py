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


# ---------- Ejercicios ----------

def create_exercise(
    db: Session,
    user_id: UUID,
    module_id: str,
    topic: Optional[str],
    difficulty: str,
    title: str,
    statement: str,
    starter_code: str,
    hints: List[str],
) -> models.Exercise:
    exercise = models.Exercise(
        user_id=user_id,
        module_id=module_id,
        topic=topic,
        difficulty=difficulty,
        title=title,
        statement=statement,
        starter_code=starter_code,
        hints=hints,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


def get_exercise(db: Session, exercise_id: UUID) -> Optional[models.Exercise]:
    return db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()


def list_exercises_with_last_attempt(db: Session, user_id: UUID, module_id: str, limit: int = 30):
    exercises = (
        db.query(models.Exercise)
        .filter(models.Exercise.user_id == user_id, models.Exercise.module_id == module_id)
        .order_by(models.Exercise.created_at.desc())
        .limit(limit)
        .all()
    )
    pairs = []
    for ex in exercises:
        last_attempt = (
            db.query(models.ExerciseAttempt)
            .filter(models.ExerciseAttempt.exercise_id == ex.id)
            .order_by(models.ExerciseAttempt.created_at.desc())
            .first()
        )
        pairs.append((ex, last_attempt))
    return pairs


def create_attempt(
    db: Session,
    exercise_id: UUID,
    user_id: UUID,
    user_code: str,
    correct: bool,
    score: int,
    feedback: str,
) -> models.ExerciseAttempt:
    attempt = models.ExerciseAttempt(
        exercise_id=exercise_id,
        user_id=user_id,
        user_code=user_code,
        correct=correct,
        score=score,
        feedback=feedback,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


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
        progress = models.ModuleProgress(
            user_id=user_id,
            module_id=module_id,
            exercises_attempted=0,
            exercises_correct=0,
            total_score=0,
        )
        db.add(progress)

    progress.exercises_attempted = (progress.exercises_attempted or 0) + 1
    progress.exercises_correct = (progress.exercises_correct or 0) + (
        1 if correct else 0
    )
    progress.total_score = (progress.total_score or 0) + score
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
