"""
Analysis API Schemas.
"""

from typing import Optional
import uuid
from pydantic import BaseModel, Field

class RepositoryAnalysisRequest(BaseModel):
    repository_url: str = Field(..., description="URL of the repository to analyze")
    branch: str = Field("main", description="Branch name")
    pipeline_type: str = Field("github_actions", description="CI/CD pipeline type")

class TelemetryAnalysisRequest(BaseModel):
    workflow_run_id: uuid.UUID = Field(..., description="ID of the workflow run to analyze")
