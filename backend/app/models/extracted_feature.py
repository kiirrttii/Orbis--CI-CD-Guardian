"""
ExtractedFeature ORM model.
Stores the computed feature vector for a given workflow run.
"""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, Integer, String, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.workflow_run import WorkflowRun


class ExtractedFeature(BaseModel):
    """
    Feature vector extracted from a workflow run for ML input.
    Raw features are stored in a JSONB blob; typed columns hold
    the most critical features for direct querying.
    """

    __tablename__ = "extracted_features"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # ── Core Feature Columns (typed for fast queries) ─────────────────────────
    files_changed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    additions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    deletions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    prior_failure_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    time_since_last_run_seconds: Mapped[Optional[float]] = mapped_column(
        Float, nullable=True
    )
    concurrent_runs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_since_last_success: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ── Feature Engineering Version ───────────────────────────────────────────
    feature_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="v1"
    )

    # ── Full Feature Blob (forward-compatible) ────────────────────────────────
    feature_vector: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    workflow_run: Mapped["WorkflowRun"] = relationship(
        "WorkflowRun", back_populates="extracted_features"
    )
