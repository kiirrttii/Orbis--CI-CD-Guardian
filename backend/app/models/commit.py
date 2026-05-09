"""
Commit ORM model.
Stores Git commit metadata associated with workflow runs.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.repository import Repository
    from app.models.workflow_run import WorkflowRun


class Commit(BaseModel):
    """Represents a Git commit linked to workflow runs."""

    __tablename__ = "commits"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    repository_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Git Metadata ──────────────────────────────────────────────────────────
    sha: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    short_sha: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # ── Author ────────────────────────────────────────────────────────────────
    author_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    author_email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    authored_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # ── Change Stats ──────────────────────────────────────────────────────────
    files_changed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    additions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    deletions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_merge_commit: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    repository: Mapped["Repository"] = relationship(
        "Repository", back_populates="commits"
    )
    workflow_runs: Mapped[List["WorkflowRun"]] = relationship(
        "WorkflowRun", back_populates="commit"
    )
