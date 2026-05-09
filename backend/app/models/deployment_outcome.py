"""
DeploymentOutcome ORM model.
Records the actual outcome of a deployment for model training feedback.
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.workflow_run import WorkflowRun


class OutcomeLabel(str, enum.Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    ROLLBACK = "rollback"
    PARTIAL = "partial"


class DeploymentOutcome(BaseModel):
    """
    Ground-truth outcome of a deployment.
    Used for model retraining and accuracy measurement.
    """

    __tablename__ = "deployment_outcomes"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # ── Outcome ───────────────────────────────────────────────────────────────
    label: Mapped[OutcomeLabel] = mapped_column(
        Enum(OutcomeLabel, name="outcome_label_enum"),
        nullable=False,
        index=True,
    )
    was_rolled_back: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    rollback_duration_seconds: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    incident_created: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    incident_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # ── Impact Metrics ────────────────────────────────────────────────────────
    downtime_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    error_rate_spike: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    latency_spike_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    deployed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Notes ─────────────────────────────────────────────────────────────────
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    workflow_run: Mapped["WorkflowRun"] = relationship(
        "WorkflowRun", back_populates="deployment_outcomes"
    )
