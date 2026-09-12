from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_user
from ..groq_client import chat_completion, extract_json
from ..schemas import Exercise, ExerciseRequest, SubmitSolutionRequest, SubmitSolutionResponse
from .modules import get_module_or_404

router = APIRouter(prefix="/exercises", tags=["exercises"])


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

    return Exercise(
        title=data.get("title", "Ejercicio"),
        statement=data.get("statement", ""),
        starter_code=data.get("starter_code", ""),
        difficulty=req.difficulty,
        hints=data.get("hints", []),
    )


@router.post("/submit", response_model=SubmitSolutionResponse)
def submit_solution(
    req: SubmitSolutionRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module = get_module_or_404(db, req.module_id)

    prompt = (
        f"Eres un evaluador de código en {module.name}. "
        f"Enunciado del ejercicio: {req.exercise_statement}\n\n"
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

    crud.record_attempt(db, current_user.id, req.module_id, correct, score)

    return SubmitSolutionResponse(correct=correct, score=score, feedback=feedback)