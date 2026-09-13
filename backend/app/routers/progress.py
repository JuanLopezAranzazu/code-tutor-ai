from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, models
from ..database import get_db
from ..dependencies import get_current_user
from ..schemas import ModuleProgressOut, ProgressResponse

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/me", response_model=ProgressResponse)
def get_my_progress(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_modules = crud.list_modules(db)
    rows = {p.module_id: p for p in crud.get_progress_for_user(db, current_user.id)}

    modules_out = []
    for m in all_modules:
        row = rows.get(m.id)
        if not row:
            modules_out.append(
                ModuleProgressOut(
                    module_id=m.id,
                    exercises_attempted=0,
                    exercises_correct=0,
                    average_score=0.0,
                    last_activity=None,
                )
            )
            continue
        avg = (row.total_score / row.exercises_attempted) if row.exercises_attempted else 0.0
        modules_out.append(
            ModuleProgressOut(
                module_id=m.id,
                exercises_attempted=row.exercises_attempted,
                exercises_correct=row.exercises_correct,
                average_score=round(avg, 1),
                last_activity=row.last_activity,
            )
        )

    return ProgressResponse(modules=modules_out)
