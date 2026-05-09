"""
GitHub API client.
Provides authenticated HTTP access to the GitHub REST API.
Designed to be easily extended with additional endpoint wrappers.
"""

import asyncio
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class GitHubAPIError(Exception):
    """Raised when the GitHub API returns a non-2xx response."""

    def __init__(self, status_code: int, message: str) -> None:
        self.status_code = status_code
        self.message = message
        super().__init__(f"GitHub API error {status_code}: {message}")


class GitHubRateLimitError(GitHubAPIError):
    """Raised when the GitHub API rate limit is exceeded."""


class GitHubClient:
    """
    Async GitHub REST API client.

    Usage:
        async with GitHubClient(token="ghp_...") as client:
            repo = await client.get_repository("owner", "repo")
    """

    def __init__(self, token: str) -> None:
        self._token = token
        self._base_url = settings.GITHUB_API_BASE_URL
        self._timeout = settings.GITHUB_API_TIMEOUT
        self._client: Optional[httpx.AsyncClient] = None

    # ── Context manager ───────────────────────────────────────────────────────

    async def __aenter__(self) -> "GitHubClient":
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            headers=self._build_headers(),
            timeout=self._timeout,
        )
        return self

    async def __aexit__(self, *args: Any) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    # ── Headers ───────────────────────────────────────────────────────────────

    def _build_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    # ── Low-level request wrapper ─────────────────────────────────────────────

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Any:
        """
        Execute an authenticated HTTP request against the GitHub API.
        Handles rate limiting and common error cases.
        """
        if self._client is None:
            raise RuntimeError("GitHubClient must be used as an async context manager.")

        logger.debug("github_api_request", method=method, path=path, params=params)

        for attempt in range(1, settings.GITHUB_MAX_RETRIES + 1):
            response = await self._client.request(
                method, path, params=params, json=json
            )

            if response.status_code == 200:
                return response.json()

            if response.status_code == 429 or (
                response.status_code == 403
                and "rate limit" in response.text.lower()
            ):
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning(
                    "github_rate_limit_hit",
                    attempt=attempt,
                    retry_after=retry_after,
                )
                if attempt < settings.GITHUB_MAX_RETRIES:
                    await asyncio.sleep(retry_after)
                    continue
                raise GitHubRateLimitError(
                    response.status_code, "GitHub API rate limit exceeded."
                )

            if response.status_code == 401:
                raise GitHubAPIError(401, "Invalid or expired GitHub token.")

            if response.status_code == 404:
                raise GitHubAPIError(404, f"GitHub resource not found: {path}")

            # Generic error
            try:
                body = response.json()
                message = body.get("message", response.text)
            except Exception:
                message = response.text

            raise GitHubAPIError(response.status_code, message)

        raise GitHubAPIError(500, "GitHub API request failed after retries.")

    # ── Repository endpoints ──────────────────────────────────────────────────

    async def get_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        """
        Fetch repository metadata from GitHub.
        GET /repos/{owner}/{repo}
        """
        return await self._request("GET", f"/repos/{owner}/{repo}")

    async def validate_repository(self, owner: str, repo: str) -> bool:
        """
        Return True if the repository is accessible with the current token.
        Raises GitHubAPIError on auth or not-found errors.
        """
        try:
            await self.get_repository(owner, repo)
            return True
        except GitHubAPIError as exc:
            logger.warning(
                "github_repo_validation_failed",
                owner=owner,
                repo=repo,
                status_code=exc.status_code,
                message=exc.message,
            )
            raise

    # ── Workflow endpoints (scaffolded for Phase 2) ───────────────────────────

    async def list_workflow_runs(
        self,
        owner: str,
        repo: str,
        *,
        branch: Optional[str] = None,
        per_page: int = 30,
        page: int = 1,
    ) -> Dict[str, Any]:
        """
        Fetch paginated workflow runs for a repository.
        GET /repos/{owner}/{repo}/actions/runs
        Phase 2 — scaffolded but not yet wired to ingestion.
        """
        params: Dict[str, Any] = {"per_page": per_page, "page": page}
        if branch:
            params["branch"] = branch
        return await self._request(
            "GET", f"/repos/{owner}/{repo}/actions/runs", params=params
        )

    async def get_workflow_run(
        self, owner: str, repo: str, run_id: int
    ) -> Dict[str, Any]:
        """
        Fetch a single workflow run by ID.
        GET /repos/{owner}/{repo}/actions/runs/{run_id}
        Phase 2 — scaffolded.
        """
        return await self._request(
            "GET", f"/repos/{owner}/{repo}/actions/runs/{run_id}"
        )

    async def list_commits(
        self,
        owner: str,
        repo: str,
        *,
        branch: Optional[str] = None,
        per_page: int = 30,
        page: int = 1,
    ) -> list:
        """
        Fetch paginated commits.
        GET /repos/{owner}/{repo}/commits
        Phase 2 — scaffolded.
        """
        params: Dict[str, Any] = {"per_page": per_page, "page": page}
        if branch:
            params["sha"] = branch
        return await self._request(
            "GET", f"/repos/{owner}/{repo}/commits", params=params
        )
