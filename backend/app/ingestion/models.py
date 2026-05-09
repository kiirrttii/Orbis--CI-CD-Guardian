"""
Telemetry Ingestion Schemas.
"""

from typing import Dict
from pydantic import BaseModel, Field

class TelemetryPayload(BaseModel):
    """
    Standardized payload format from any CI/CD adapter.
    """
    source_id: str = Field(..., description="Original ID from the source system (e.g. github run id)")
    source_system: str = Field(..., description="System that generated the telemetry (github, jenkins)")
    status: str = Field(..., description="Status of the run (completed, failed, success)")
    repository_id: str = Field(..., description="ID of the repository")
    metrics: Dict[str, float] = Field(..., description="Extracted feature metrics mapped to prediction requirements")

