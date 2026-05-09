"""
WorkflowRun ORM model.
Captures a single GitHub Actions workflow execution.
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.repository import Repository
    from app.models.commit import Commit
    from app.models.extracted_feature import ExtractedFeature
    from app.models.prediction import Prediction
    from app.models.deployment_outcome import DeploymentOutcome


class WorkflowRunStatus(str, enum.Enum):
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    SKIPPED = "skipped"


class WorkflowRunConclusion(str, enum.Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    NEUTRAL = "neutral"
    CANCELLED = "cancelled"
    SKIPPED = "skipped"
    TIMED_OUT = "timed_out"
    ACTION_REQUIRED = "action_required"


class WorkflowRun(BaseModel):
    """Represents a single GitHub Actions workflow run."""

    __tablename__ = "workflow_runs"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    repository_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    commit_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commits.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── GitHub Identifiers ────────────────────────────────────────────────────
    github_run_id: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    workflow_name: Mapped[str] = mapped_column(String(512), nullable=False)
    workflow_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    head_branch: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    head_sha: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    run_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    run_attempt: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    event: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # ── Status ────────────────────────────────────────────────────────────────
    status: Mapped[WorkflowRunStatus] = mapped_column(
        Enum(WorkflowRunStatus, name="workflow_run_status_enum"),
        nullable=False,
        index=True,
    )
    conclusion: Mapped[Optional[WorkflowRunConclusion]] = mapped_column(
        Enum(WorkflowRunConclusion, name="workflow_run_conclusion_enum"),
        nullable=True,
        index=True,
    )

    # ── Timing ────────────────────────────────────────────────────────────────
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # ── Actor ─────────────────────────────────────────────────────────────────
    triggering_actor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    html_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    repository: Mapped["Repository"] = relationship(
        "Repository", back_populates="workflow_runs"
    )
    commit: Mapped[Optional["Commit"]] = relationship(
        "Commit", back_populates="workflow_runs"
    )
    extracted_features: Mapped[List["ExtractedFeature"]] = relationship(
        "ExtractedFeature", back_populates="workflow_run", cascade="all, delete-orphan"
    )
    predictions: Mapped[List["Prediction"]] = relationship(
        "Prediction", back_populates="workflow_run", cascade="all, delete-orphan"
    )
    deployment_outcomes: Mapped[List["DeploymentOutcome"]] = relationship(
        "DeploymentOutcome",
        back_populates="workflow_run",
        cascade="all, delete-orphan",
    )
