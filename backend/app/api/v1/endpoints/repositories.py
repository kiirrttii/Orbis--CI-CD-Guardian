"""
Repository API endpoints.
All business logic is delegated to RepositoryService.
Routers are thin controllers only.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.database.session import get_db
from app.schemas.repository import (
    RepositoryConnectRequest,
    RepositoryConnectResponse,
    RepositoryDetail,
    RepositoryListResponse,
)
from app.services.repository_service import RepositoryService

logger = get_logger(__name__)

router = APIRouter(prefix="/repositories", tags=["Repositories"])


# ---------------------------------------------------------------------------
# Dependency — build service with injected DB session
# ---------------------------------------------------------------------------

def _get_repository_service(
    db: AsyncSession = Depends(get_db),
) -> RepositoryService:
    return RepositoryService(session=db)


ServiceDep = Annotated[RepositoryService, Depends(_get_repository_service)]


# ---------------------------------------------------------------------------
# POST /repositories/connect
# ---------------------------------------------------------------------------

@router.post(
    "/connect",
    response_model=RepositoryConnectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Connect a GitHub repository",
    description=(
        "Validate a GitHub repository URL, fetch metadata via the GitHub API, "
        "and persist the repository for CI/CD telemetry ingestion."
    ),
)
async def connect_repository(
    payload: RepositoryConnectRequest,
    service: ServiceDep,
) -> RepositoryConnectResponse:
    logger.info("endpoint_connect_repository", repo_url=payload.repo_url)
    return await service.connect_repository(payload)


# ---------------------------------------------------------------------------
# GET /repositories
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=RepositoryListResponse,
    summary="List connected repositories",
    description="Return a paginated list of all active connected repositories.",
)
async def list_repositories(
    service: ServiceDep,
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
) -> RepositoryListResponse:
    logger.info("endpoint_list_repositories", page=page, page_size=page_size)
    return await service.list_repositories(page=page, page_size=page_size)


# ---------------------------------------------------------------------------
# GET /repositories/{id}
# ---------------------------------------------------------------------------

@router.get(
    "/{repository_id}",
    response_model=RepositoryDetail,
    summary="Get repository details",
    description="Return full details for a single repository by its UUID.",
)
async def get_repository(
    repository_id: uuid.UUID,
    service: ServiceDep,
) -> RepositoryDetail:
    logger.info("endpoint_get_repository", repository_id=str(repository_id))
    repo = await service.get_repository(repository_id)
    if repo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository {repository_id} not found.",
        )
    return RepositoryDetail.model_validate(repo)
