import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)

    progress = relationship(
        "ModuleProgress", back_populates="user", cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessage", back_populates="user", cascade="all, delete-orphan"
    )


class Module(Base):
    """Un módulo = un lenguaje de programación."""

    __tablename__ = "modules"

    id = Column(String, primary_key=True)  # ej: "python"
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    order = Column(Integer, default=0, nullable=False)

    topics = relationship(
        "Topic",
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="Topic.order",
    )


class Topic(Base):
    """Un tema dentro de un módulo (ej: 'POO' dentro de Python)."""

    __tablename__ = "topics"
    __table_args__ = (UniqueConstraint("module_id", "key", name="uq_module_topic_key"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    key = Column(String, nullable=False)  # identificador estable, ej: "poo"
    name = Column(String, nullable=False)
    order = Column(Integer, default=0, nullable=False)

    module = relationship("Module", back_populates="topics")


class ModuleProgress(Base):
    __tablename__ = "module_progress"
    __table_args__ = (UniqueConstraint("user_id", "module_id", name="uq_user_module"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    exercises_attempted = Column(Integer, default=0, nullable=False)
    exercises_correct = Column(Integer, default=0, nullable=False)
    total_score = Column(Integer, default=0, nullable=False)
    last_activity = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="progress")


class ChatMessage(Base):
    """Historial de conversación del tutor, por usuario y por módulo."""

    __tablename__ = "chat_messages"
    __table_args__ = (Index("ix_chat_user_module", "user_id", "module_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user" | "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)

    user = relationship("User", back_populates="chat_messages")