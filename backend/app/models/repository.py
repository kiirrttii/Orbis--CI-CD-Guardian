"""
Repository ORM model.
Represents a connected GitHub repository being monitored.
"""

import enum
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.workflow_run import WorkflowRun
    from app.models.commit import Commit


class ConnectionStatus(str, enum.Enum):
    PENDING = "pending"
    CONNECTED = "connected"
    FAILED = "failed"
    DISCONNECTED = "disconnected"


class Repository(BaseModel):
    """Stores metadata for a connected GitHub repository."""

    __tablename__ = "repositories"

    # ── Identity ──────────────────────────────────────────────────────────────
    repo_url: Mapped[str] = mapped_column(
        String(512), nullable=False, unique=True, index=True
    )
    owner: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(
        String(512), nullable=False, unique=True
    )  # e.g. "org/project"
    branch: Mapped[str] = mapped_column(String(255), nullable=False, default="main")

    # ── Credentials (token stored encrypted in production) ────────────────────
    github_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Status ────────────────────────────────────────────────────────────────
    connection_status: Mapped[ConnectionStatus] = mapped_column(
        Enum(ConnectionStatus, name="connection_status_enum"),
        nullable=False,
        default=ConnectionStatus.PENDING,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # ── GitHub metadata ───────────────────────────────────────────────────────
    github_repo_id: Mapped[Optional[int]] = mapped_column(nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    default_branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_private: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stars_count: Mapped[Optional[int]] = mapped_column(nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    workflow_runs: Mapped[List["WorkflowRun"]] = relationship(
        "WorkflowRun", back_populates="repository", cascade="all, delete-orphan"
    )
    commits: Mapped[List["Commit"]] = relationship(
        "Commit", back_populates="repository", cascade="all, delete-orphan"
    )
