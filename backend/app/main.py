from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import CORS_ORIGINS
from .database import engine

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


@app.get("/health")
def health():
    return {"status": "ok"}
