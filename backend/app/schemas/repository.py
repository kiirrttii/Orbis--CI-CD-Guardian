"""
Repository Pydantic schemas.
Defines request/response contracts for the repository onboarding API.
"""

import uuid
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.models.repository import ConnectionStatus


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class RepositoryConnectRequest(BaseModel):
    """Payload for POST /api/v1/repositories/connect."""

    repo_url: str = Field(
        ...,
        description="Full GitHub repository URL, e.g. https://github.com/org/project",
        examples=["https://github.com/org/project"],
    )
    github_token: str = Field(
        ...,
        description="Personal access token or fine-grained token with repo read access",
        min_length=1,
    )
    branch: str = Field(
        default="main",
        description="Target branch to monitor",
        max_length=255,
    )

    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        """Ensure the URL is a valid GitHub repository URL."""
        import re

        pattern = r"^https://github\.com/[\w\-\.]+/[\w\-\.]+/?$"
        if not re.match(pattern, v.rstrip("/")):
            raise ValueError(
                "repo_url must be a valid GitHub repository URL "
                "(https://github.com/<owner>/<repo>)"
            )
        return v.rstrip("/")

    @field_validator("branch")
    @classmethod
    def validate_branch(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("branch cannot be blank")
        return v.strip()


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class RepositoryBase(BaseModel):
    """Shared read fields."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    repo_url: str
    owner: str
    name: str
    full_name: str
    branch: str
    connection_status: ConnectionStatus
    is_active: bool


class RepositoryDetail(RepositoryBase):
    """Full repository detail response."""

    github_repo_id: Optional[int] = None
    description: Optional[str] = None
    default_branch: Optional[str] = None
    is_private: Optional[bool] = None
    language: Optional[str] = None
    stars_count: Optional[int] = None
    created_at: "datetime"
    updated_at: "datetime"


class RepositoryConnectResponse(BaseModel):
    """Response for the connect endpoint."""

    repository_id: uuid.UUID
    full_name: str
    connection_status: ConnectionStatus
    message: str


class RepositoryListResponse(BaseModel):
    """Response for list endpoint."""

    items: list[RepositoryBase]
    total: int


# Resolve forward refs
from datetime import datetime  # noqa: E402

RepositoryDetail.model_rebuild()
