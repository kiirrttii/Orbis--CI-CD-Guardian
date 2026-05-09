"""
Models package — import all models here so Alembic autogenerate
can discover them via `Base.metadata`.
"""

from app.models.base import BaseModel  # noqa: F401
from app.models.repository import Repository, ConnectionStatus  # noqa: F401
from app.models.workflow_run import WorkflowRun, WorkflowRunStatus, WorkflowRunConclusion  # noqa: F401
from app.models.commit import Commit  # noqa: F401
from app.models.extracted_feature import ExtractedFeature  # noqa: F401
from app.models.prediction import Prediction  # noqa: F401
from app.models.feature_contribution import FeatureContribution  # noqa: F401
from app.models.recommendation import Recommendation, RecommendationPriority, RecommendationStatus  # noqa: F401
from app.models.deployment_outcome import DeploymentOutcome, OutcomeLabel  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = [
    "BaseModel",
    "Repository",
    "ConnectionStatus",
    "WorkflowRun",
    "WorkflowRunStatus",
    "WorkflowRunConclusion",
    "Commit",
    "ExtractedFeature",
    "Prediction",
    "FeatureContribution",
    "Recommendation",
    "RecommendationPriority",
    "RecommendationStatus",
    "DeploymentOutcome",
    "OutcomeLabel",
    "User",
]
