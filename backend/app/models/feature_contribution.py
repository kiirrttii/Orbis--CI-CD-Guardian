"""
FeatureContribution ORM model.
Stores per-feature SHAP/explainability values for a prediction.
"""

import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Float, ForeignKey, String, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.prediction import Prediction


class FeatureContribution(BaseModel):
    """
    Per-feature contribution to a model prediction.
    Designed to hold SHAP values (or similar explainability scores).
    """

    __tablename__ = "feature_contributions"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Feature Attribution ───────────────────────────────────────────────────
    feature_name: Mapped[str] = mapped_column(String(255), nullable=False)
    feature_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    contribution_value: Mapped[float] = mapped_column(Float, nullable=False)  # SHAP value
    impact_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Normalized magnitude
    contribution_rank: Mapped[Optional[int]] = mapped_column(nullable=True)
    direction: Mapped[Optional[str]] = mapped_column(
        String(20), nullable=True
    )  # "increase_risk" | "decrease_risk"

    # ── Relationships ─────────────────────────────────────────────────────────
    prediction: Mapped["Prediction"] = relationship(
        "Prediction", back_populates="feature_contributions"
    )
