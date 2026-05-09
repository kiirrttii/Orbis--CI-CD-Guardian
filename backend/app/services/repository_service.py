"""
Repository service layer.
Orchestrates business logic for repository onboarding.
No direct DB access — delegates to RepositoryRepository.
No HTTP concerns — delegates to GitHubClient.
"""

import re
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.integrations.github.client import GitHubAPIError, GitHubClient
from app.models.repository import ConnectionStatus, Repository
from app.repositories.repository_repo import RepositoryRepository
from app.schemas.repository import (
    RepositoryConnectRequest,
    RepositoryConnectResponse,
    RepositoryListResponse,
)

logger = get_logger(__name__)

_GITHUB_URL_RE = re.compile(
    r"^https://github\.com/(?P<owner>[\w\-\.]+)/(?P<repo>[\w\-\.]+)/?$"
)


def _parse_github_url(url: str) -> tuple[str, str]:
    """Extract (owner, repo_name) from a GitHub URL."""
    match = _GITHUB_URL_RE.match(url)
    if not match:
        raise ValueError(f"Cannot parse GitHub URL: {url}")
    return match.group("owner"), match.group("repo")


class RepositoryService:
    """
    Business logic for repository onboarding and management.
    Injected with an AsyncSession; creates repositories and GitHub clients
    internally.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._repo_repo = RepositoryRepository(session)

    # ── Connect ───────────────────────────────────────────────────────────────

    async def connect_repository(
        self, request: RepositoryConnectRequest
    ) -> RepositoryConnectResponse:
        """
        Onboard a GitHub repository:
        1. Parse owner/name from URL.
        2. Check for duplicates.
        3. Validate via GitHub API.
        4. Persist repository metadata.
        5. Return connection response.
        """
        owner, repo_name = _parse_github_url(request.repo_url)
        full_name = f"{owner}/{repo_name}"

        logger.info("repository_connect_start", full_name=full_name)

        # ── Duplicate check ────────────────────────────────────────────────────
        existing = await self._repo_repo.get_by_full_name(full_name)
        if existing:
            logger.info("repository_already_connected", full_name=full_name)
            return RepositoryConnectResponse(
                repository_id=existing.id,
                full_name=existing.full_name,
                connection_status=existing.connection_status,
                message="Repository already connected.",
            )

        # ── GitHub validation & metadata fetch ────────────────────────────────
        github_metadata: Optional[dict] = None
        try:
            async with GitHubClient(token=request.github_token) as gh:
                github_metadata = await gh.get_repository(owner, repo_name)
            status = ConnectionStatus.CONNECTED
            logger.info("github_repo_validated", full_name=full_name)
        except GitHubAPIError as exc:
            logger.warning(
                "github_repo_validation_failed",
                full_name=full_name,
                status_code=exc.status_code,
                message=exc.message,
            )
            status = ConnectionStatus.FAILED
            github_metadata = None

        # ── Persist ────────────────────────────────────────────────────────────
        repository = Repository(
            repo_url=request.repo_url,
            owner=owner,
            name=repo_name,
            full_name=full_name,
            branch=request.branch,
            github_token=request.github_token,  # TODO: encrypt in production
            connection_status=status,
            is_active=True,
        )

        if github_metadata:
            repository.github_repo_id = github_metadata.get("id")
            repository.description = github_metadata.get("description")
            repository.default_branch = github_metadata.get("default_branch")
            repository.is_private = github_metadata.get("private")
            repository.language = github_metadata.get("language")
            repository.stars_count = github_metadata.get("stargazers_count")

        saved = await self._repo_repo.create(repository)
        logger.info(
            "repository_created",
            repository_id=str(saved.id),
            full_name=full_name,
            status=status.value,
        )

        message = (
            "Repository connected successfully."
            if status == ConnectionStatus.CONNECTED
            else "Repository saved but GitHub validation failed. Check the token."
        )

        return RepositoryConnectResponse(
            repository_id=saved.id,
            full_name=saved.full_name,
            connection_status=saved.connection_status,
            message=message,
        )

    # ── List ──────────────────────────────────────────────────────────────────

    async def list_repositories(
        self, *, page: int = 1, page_size: int = 20
    ) -> RepositoryListResponse:
        """Return a paginated list of active repositories."""
        offset = (page - 1) * page_size
        items, total = await self._repo_repo.list_all(
            active_only=True, offset=offset, limit=page_size
        )
        return RepositoryListResponse(items=list(items), total=total)

    # ── Get by ID ─────────────────────────────────────────────────────────────

    async def get_repository(self, repo_id: uuid.UUID) -> Optional[Repository]:
        """Return a repository by UUID or None."""
        return await self._repo_repo.get_by_id(repo_id)
