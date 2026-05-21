"""
Prediction ORM model.
Stores ML model outputs (risk score, probability, label) for a workflow run.
"""

import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Float, ForeignKey, String, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.workflow_run import WorkflowRun
    from app.models.feature_contribution import FeatureContribution
    from app.models.recommendation import Recommendation
    from app.models.user import User
    from app.models.repository import Repository


class Prediction(BaseModel):
    """
    ML model prediction for a workflow run.
    Stores risk score, binary label, and raw model probabilities.
    """

    __tablename__ = "predictions"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    workflow_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    repository_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Model Versioning ──────────────────────────────────────────────────────
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    model_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="v1"
    )

    # ── Prediction Output ─────────────────────────────────────────────────────
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)          # 0.0–100.0
    severity: Mapped[str] = mapped_column(String(20), nullable=False, default="LOW")
    analysis_type: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence_level: Mapped[str] = mapped_column(String(20), nullable=False, default="LOW")
    failure_probability: Mapped[float] = mapped_column(Float, nullable=False) # 0.0–1.0
    predicted_label: Mapped[str] = mapped_column(String(50), nullable=False)  # "pass" | "fail"

    raw_output: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # ── Relationships ─────────────────────────────────────────────────────────
    workflow_run: Mapped["WorkflowRun"] = relationship(
        "WorkflowRun", back_populates="predictions"
    )
    user: Mapped[Optional["User"]] = relationship("User")
    repository: Mapped[Optional["Repository"]] = relationship("Repository")
    feature_contributions: Mapped[List["FeatureContribution"]] = relationship(
        "FeatureContribution",
        back_populates="prediction",
        cascade="all, delete-orphan",
    )
    recommendations: Mapped[List["Recommendation"]] = relationship(
        "Recommendation",
        back_populates="prediction",
        cascade="all, delete-orphan",
    )


# Alias for Deployment Check
Deployment = Prediction
