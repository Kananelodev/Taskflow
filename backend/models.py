from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey, Table
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid


def gen_uuid():
    return str(uuid.uuid4())


# ─── Association table for Task <-> Label many-to-many ────────────────────────

TaskLabel = Table(
    "task_labels",
    Base.metadata,
    Column("task_id", String, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("label_id", String, ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True),
)


# ─── User ─────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    google_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=False)
    name = Column(String, default="")
    picture = Column(String, default="")

    # Encrypted OAuth tokens (JSON blob encrypted with Fernet)
    encrypted_tokens = Column(Text, default="")

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    labels = relationship("Label", back_populates="user", cascade="all, delete-orphan")


# ─── Task ─────────────────────────────────────────────────────────────────────

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    notes = Column(Text, default="")
    date = Column(String, default=None)       # YYYY-MM-DD
    time = Column(String, default=None)       # HH:MM
    done = Column(Boolean, default=False)
    priority = Column(Integer, default=0)      # 0=none, 1=low, 2=medium, 3=high, 4=urgent
    position = Column(Float, default=0.0)      # for drag-and-drop ordering
    calendar_event_id = Column(String, default=None)
    synced = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tasks")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan", order_by="Subtask.position")
    labels = relationship("Label", secondary=TaskLabel, back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "notes": self.notes,
            "date": self.date,
            "time": self.time,
            "done": self.done,
            "priority": self.priority,
            "position": self.position,
            "calendar_event_id": self.calendar_event_id,
            "synced": self.synced,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "labels": [l.to_dict() for l in self.labels],
            "subtasks": [s.to_dict() for s in self.subtasks],
        }


# ─── Label ────────────────────────────────────────────────────────────────────

class Label(Base):
    __tablename__ = "labels"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color = Column(String, default="#888888")

    # Relationships
    user = relationship("User", back_populates="labels")
    tasks = relationship("Task", secondary=TaskLabel, back_populates="labels")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color,
        }


# ─── Subtask ──────────────────────────────────────────────────────────────────

class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(String, primary_key=True, default=gen_uuid)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    done = Column(Boolean, default=False)
    position = Column(Float, default=0.0)

    # Relationships
    task = relationship("Task", back_populates="subtasks")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "done": self.done,
            "position": self.position,
        }
