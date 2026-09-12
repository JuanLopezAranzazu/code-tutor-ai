from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import CORS_ORIGINS
from .database import SessionLocal, engine
from .routers import auth, exercises, modules, progress, tutor
from .seed import seed_modules

app = FastAPI(title="Code Tutor AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Para producción real, reemplazar por migraciones de Alembic.
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed_modules(db)
    finally:
        db.close()


app.include_router(auth.router)
app.include_router(modules.router)
app.include_router(tutor.router)
app.include_router(exercises.router)
app.include_router(progress.router)


@app.get("/health")
def health():
    return {"status": "ok"}