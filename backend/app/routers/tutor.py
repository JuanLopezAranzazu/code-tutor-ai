from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_user
from ..groq_client import chat_completion
from ..schemas import ChatMessageOut, TutorRequest, TutorResponse
from .modules import get_module_or_404

router = APIRouter(prefix="/tutor", tags=["tutor"])

HISTORY_WINDOW = 20  # mensajes recientes que se mandan como contexto al modelo


def _system_prompt(module_name: str) -> str:
    return (
        f"Eres un tutor experto de programación especializado en {module_name}. "
        "Explicas conceptos de forma clara, con ejemplos de código cortos y en español. "
        "Adaptas la explicación al nivel que muestre el estudiante en su pregunta. "
        "Si el estudiante comete un error conceptual, corrígelo con amabilidad. "
        "Sé conciso: prioriza explicaciones directas y ejemplos prácticos por sobre la teoría extensa."
    )


@router.get("/history/{module_id}", response_model=List[ChatMessageOut])
def get_history(
    module_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_module_or_404(db, module_id)
    return crud.get_chat_history(db, current_user.id, module_id)


@router.post("/chat", response_model=TutorResponse)
def tutor_chat(
    req: TutorRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    module = get_module_or_404(db, req.module_id)

    previous = crud.get_chat_history(db, current_user.id, req.module_id, limit=HISTORY_WINDOW)

    messages = [{"role": "system", "content": _system_prompt(module.name)}]
    for h in previous:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": req.message})

    try:
        reply = chat_completion(messages)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Persistimos ambos mensajes recién después de tener la respuesta del modelo,
    # para no guardar el mensaje del usuario si Groq falla.
    crud.add_chat_message(db, current_user.id, req.module_id, "user", req.message)
    crud.add_chat_message(db, current_user.id, req.module_id, "assistant", reply)

    return TutorResponse(reply=reply)


@router.delete("/history/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def reset_history(
    module_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_module_or_404(db, module_id)
    crud.clear_chat_history(db, current_user.id, module_id)