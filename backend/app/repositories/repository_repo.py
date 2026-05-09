"""
Repository data-access repository (Repository Pattern).
Encapsulates all database operations for the Repository model.
No business logic — pure DB access only.
"""

import uuid
from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import ConnectionStatus, Repository


class RepositoryRepository:
    """Data-access object for Repository entities."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Read ──────────────────────────────────────────────────────────────────

    async def get_by_id(self, repo_id: uuid.UUID) -> Optional[Repository]:
        """Return a repository by its UUID primary key."""
        result = await self._session.execute(
            select(Repository).where(Repository.id == repo_id)
        )
        return result.scalar_one_or_none()

    async def get_by_url(self, repo_url: str) -> Optional[Repository]:
        """Return a repository by its GitHub URL."""
        result = await self._session.execute(
            select(Repository).where(Repository.repo_url == repo_url)
        )
        return result.scalar_one_or_none()

    async def get_by_full_name(self, full_name: str) -> Optional[Repository]:
        """Return a repository by its owner/repo full name."""
        result = await self._session.execute(
            select(Repository).where(Repository.full_name == full_name)
        )
        return result.scalar_one_or_none()

    async def list_all(
        self,
        *,
        active_only: bool = True,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Repository], int]:
        """Return a paginated list of repositories and total count."""
        query = select(Repository)
        count_query = select(func.count()).select_from(Repository)

        if active_only:
            query = query.where(Repository.is_active.is_(True))
            count_query = count_query.where(Repository.is_active.is_(True))

        query = query.order_by(Repository.created_at.desc()).offset(offset).limit(limit)

        items_result = await self._session.execute(query)
        count_result = await self._session.execute(count_query)

        return items_result.scalars().all(), count_result.scalar_one()

    # ── Write ─────────────────────────────────────────────────────────────────

    async def create(self, repository: Repository) -> Repository:
        """Persist a new Repository entity."""
        self._session.add(repository)
        await self._session.flush()  # get the PK without committing
        await self._session.refresh(repository)
        return repository

    async def update_status(
        self,
        repo_id: uuid.UUID,
        status: ConnectionStatus,
    ) -> Optional[Repository]:
        """Update only the connection_status field."""
        repo = await self.get_by_id(repo_id)
        if repo is None:
            return None
        repo.connection_status = status
        await self._session.flush()
        await self._session.refresh(repo)
        return repo

    async def update(self, repository: Repository) -> Repository:
        """Flush changes to an already-attached Repository entity."""
        await self._session.flush()
        await self._session.refresh(repository)
        return repository

    async def delete(self, repo_id: uuid.UUID) -> bool:
        """Soft-delete a repository by marking it inactive."""
        repo = await self.get_by_id(repo_id)
        if repo is None:
            return False
        repo.is_active = False
        repo.connection_status = ConnectionStatus.DISCONNECTED
        await self._session.flush()
        return True
