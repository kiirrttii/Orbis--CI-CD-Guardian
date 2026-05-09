"""
Recommendation ORM model.
Stores AI-generated operational recommendations linked to predictions.
"""

import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Enum, ForeignKey, Integer, String, Text, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.prediction import Prediction


class RecommendationPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RecommendationStatus(str, enum.Enum):
    GENERATED = "generated"
    ACKNOWLEDGED = "acknowledged"
    APPLIED = "applied"
    DISMISSED = "dismissed"


class Recommendation(BaseModel):
    """
    AI-generated recommendation to mitigate deployment risk.
    Reserved for Phase 2 — scaffold only.
    """

    __tablename__ = "recommendations"

    # ── Foreign Keys ──────────────────────────────────────────────────────────
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Content ───────────────────────────────────────────────────────────────
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    action_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    priority: Mapped[RecommendationPriority] = mapped_column(
        Enum(RecommendationPriority, name="recommendation_priority_enum"),
        nullable=False,
        default=RecommendationPriority.MEDIUM,
        index=True,
    )
    status: Mapped[RecommendationStatus] = mapped_column(
        Enum(RecommendationStatus, name="recommendation_status_enum"),
        nullable=False,
        default=RecommendationStatus.GENERATED,
        index=True,
    )
    confidence_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Relationships ─────────────────────────────────────────────────────────
    prediction: Mapped["Prediction"] = relationship("Prediction")
