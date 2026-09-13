import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_user
from ..groq_client import chat_completion, extract_json
from ..schemas import (
    Exercise,
    ExerciseHistoryItem,
    ExerciseRequest,
    SubmitSolutionRequest,
    SubmitSolutionResponse,
)
from .modules import get_module_or_404

router = APIRouter(prefix="/exercises", tags=["exercises"])


def _to_exercise_schema(exercise: models.Exercise) -> Exercise:
    return Exercise(
        id=str(exercise.id),
        title=exercise.title,
        statement=exercise.statement,
        starter_code=exercise.starter_code,
        difficulty=exercise.difficulty,
        hints=exercise.hints or [],
    )


def _get_owned_exercise(db: Session, exercise_id: str, user_id) -> models.Exercise:
    try:
        parsed_id = uuid.UUID(exercise_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

    exercise = crud.get_exercise(db, parsed_id)
    if exercise is None or exercise.user_id != user_id:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    return exercise


@router.post("/generate", response_model=Exercise)
def generate_exercise(
    req: ExerciseRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module = get_module_or_404(db, req.module_id)

    topic_text = f" sobre el tema '{req.topic}'" if req.topic else ""
    prompt = (
        f"Genera un ejercicio de programación en {module.name}{topic_text}, "
        f"de dificultad '{req.difficulty}'. "
        "Responde EXCLUSIVAMENTE con un JSON válido (sin texto adicional, sin markdown) "
        "con las claves exactas: title (string), statement (string, enunciado claro del ejercicio), "
        "starter_code (string, código inicial o plantilla con comentarios guía), "
        "hints (array de 2 a 3 strings con pistas progresivas)."
    )
    messages = [
        {"role": "system", "content": "Eres un generador de ejercicios de programación. Solo respondes JSON válido."},
        {"role": "user", "content": prompt},
    ]

    try:
        raw = chat_completion(messages, temperature=0.8)
        data = extract_json(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error generando ejercicio: {e}")

    exercise = crud.create_exercise(
        db,
        user_id=current_user.id,
        module_id=module.id,
        topic=req.topic,
        difficulty=req.difficulty,
        title=data.get("title", "Ejercicio"),
        statement=data.get("statement", ""),
        starter_code=data.get("starter_code", ""),
        hints=data.get("hints", []),
    )

    return _to_exercise_schema(exercise)


@router.get("/history/{module_id}", response_model=List[ExerciseHistoryItem])
def get_exercise_history(
    module_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_module_or_404(db, module_id)
    pairs = crud.list_exercises_with_last_attempt(db, current_user.id, module_id)
    return [
        ExerciseHistoryItem(
            id=str(ex.id),
            title=ex.title,
            topic=ex.topic,
            difficulty=ex.difficulty,
            created_at=ex.created_at,
            last_correct=attempt.correct if attempt else None,
            last_score=attempt.score if attempt else None,
        )
        for ex, attempt in pairs
    ]


@router.get("/{exercise_id}", response_model=Exercise)
def get_exercise_detail(
    exercise_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exercise = _get_owned_exercise(db, exercise_id, current_user.id)
    return _to_exercise_schema(exercise)


@router.post("/submit", response_model=SubmitSolutionResponse)
def submit_solution(
    req: SubmitSolutionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exercise = _get_owned_exercise(db, req.exercise_id, current_user.id)
    module = get_module_or_404(db, exercise.module_id)

    prompt = (
        f"Eres un evaluador de código en {module.name}. "
        f"Enunciado del ejercicio: {exercise.statement}\n\n"
        f"Código del estudiante:\n```\n{req.user_code}\n```\n\n"
        "Evalúa si el código resuelve correctamente el ejercicio (considera casos borde razonables). "
        "Responde EXCLUSIVAMENTE con un JSON válido (sin markdown) con las claves exactas: "
        "correct (boolean), score (entero de 0 a 100), feedback (string en español, "
        "explica qué está bien, qué falta o qué corregir, en tono constructivo)."
    )
    messages = [
        {"role": "system", "content": "Eres un evaluador de código estricto pero justo. Solo respondes JSON válido."},
        {"role": "user", "content": prompt},
    ]

    try:
        raw = chat_completion(messages, temperature=0.2)
        data = extract_json(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error evaluando solución: {e}")

    correct = bool(data.get("correct", False))
    score = int(data.get("score", 0))
    feedback = data.get("feedback", "")

    crud.create_attempt(db, exercise.id, current_user.id, req.user_code, correct, score, feedback)
    crud.record_attempt(db, current_user.id, exercise.module_id, correct, score)

    return SubmitSolutionResponse(correct=correct, score=score, feedback=feedback)
