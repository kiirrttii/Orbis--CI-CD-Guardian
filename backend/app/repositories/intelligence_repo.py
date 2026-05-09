"""
Intelligence Repository.

Handles atomic database transactions for the entire intelligence orchestration flow,
including storing predictions, feature contributions, and recommendations together.
"""

from typing import Optional, List
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.models.prediction import Prediction
from app.models.feature_contribution import FeatureContribution
from app.models.recommendation import Recommendation
from app.models.workflow_run import WorkflowRun


class IntelligenceRepository:
    """Repository for persisting AI intelligence outputs."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def save_intelligence_payload(
        self,
        prediction: Prediction,
        feature_contributions: List[FeatureContribution],
        recommendations: List[Recommendation]
    ) -> Prediction:
        """
        Atomically saves the prediction and its associated explainability
        and recommendations.
        """

        # Add prediction first
        self.session.add(prediction)

        # Flush so prediction.id becomes available
        await self.session.flush()

        # Attach feature contributions
        for fc in feature_contributions:
            fc.prediction_id = prediction.id
            self.session.add(fc)

        # Attach recommendations
        for rec in recommendations:
            rec.prediction_id = prediction.id
            self.session.add(rec)

        await self.session.flush()

        return prediction

    async def get_prediction_by_id(
        self,
        prediction_id: uuid.UUID
    ) -> Optional[Prediction]:
        """Fetch a prediction by its ID."""

        stmt = (
            select(Prediction)
            .where(Prediction.id == prediction_id)
        )

        result = await self.session.execute(stmt)

        return result.scalars().first()

    async def get_history(
        self,
        limit: int = 20,
        offset: int = 0,
        severity_filter: Optional[str] = None
    ) -> List[Prediction]:
        """
        Retrieves paginated historical predictions
        with workflow run information.
        """

        stmt = (
            select(Prediction)
            .options(
                selectinload(Prediction.workflow_run)
            )
            .order_by(desc(Prediction.created_at))
            .limit(limit)
            .offset(offset)
        )

        # Optional future severity filtering
        # Example:
        # if severity_filter == "HIGH":
        #     stmt = stmt.where(Prediction.risk_score >= 75)

        result = await self.session.execute(stmt)

        return result.scalars().all()

    async def get_prediction_with_details(
        self,
        prediction_id: uuid.UUID
    ) -> Optional[Prediction]:
        """
        Retrieves a prediction with all associated
        SHAP features and recommendations.
        """

        stmt = (
            select(Prediction)
            .options(
                selectinload(Prediction.workflow_run),
                selectinload(Prediction.feature_contributions),
                selectinload(Prediction.recommendations)
            )
            .where(Prediction.id == prediction_id)
        )

        result = await self.session.execute(stmt)

        return result.scalars().first()