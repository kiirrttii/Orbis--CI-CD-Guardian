"""
Health check endpoint.
Provides a liveness probe and a database connectivity check.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.database.session import get_db

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Liveness probe",
    description="Returns app version and status. No DB check.",
)
async def health() -> dict:
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get(
    "/health/db",
    summary="Readiness probe (DB ping)",
    description="Runs a lightweight SELECT 1 to confirm DB connectivity.",
)
async def health_db(db: AsyncSession = Depends(get_db)) -> dict:
    await db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "database": "reachable",
    }


@router.get(
    "/health/integrity",
    summary="System integrity check",
    description="Validates schema and data integrity (e.g. malformed preferences).",
)
async def health_integrity(db: AsyncSession = Depends(get_db)) -> dict:
    # Principal Refinement: Check for corrupted preferences
    from app.models.user import User
    stmt = select(User).where(User.preferences == None)
    result = await db.execute(stmt)
    corrupted_count = len(result.scalars().all())
    
    return {
        "status": "ok" if corrupted_count == 0 else "degraded",
        "corrupted_preferences_count": corrupted_count,
        "checked_at": "now" # Placeholder
    }
