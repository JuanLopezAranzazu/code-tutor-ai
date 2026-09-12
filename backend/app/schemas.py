from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal
from datetime import datetime

from uuid import UUID

# ---------- Auth ----------

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    name: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Modulos ----------

class TopicOut(BaseModel):
    id: UUID
    name: str


class ModuleOut(BaseModel):
    id: str
    name: str
    description: str
    topics: List[TopicOut]


# ---------- Tutor / chat ----------

class TutorRequest(BaseModel):
    module_id: str
    message: str


class TutorResponse(BaseModel):
    reply: str


class ChatMessageOut(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Ejercicios ----------

class ExerciseRequest(BaseModel):
    module_id: str
    topic: Optional[str] = None
    difficulty: Literal["facil", "media", "dificil"] = "facil"


class Exercise(BaseModel):
    title: str
    statement: str
    starter_code: str
    difficulty: str
    hints: List[str] = []


class SubmitSolutionRequest(BaseModel):
    module_id: str
    exercise_title: str
    exercise_statement: str
    user_code: str


class SubmitSolutionResponse(BaseModel):
    correct: bool
    score: int
    feedback: str


# ---------- Progreso ----------

class ModuleProgressOut(BaseModel):
    module_id: str
    exercises_attempted: int
    exercises_correct: int
    average_score: float
    last_activity: Optional[datetime] = None


class ProgressResponse(BaseModel):
    modules: List[ModuleProgressOut]