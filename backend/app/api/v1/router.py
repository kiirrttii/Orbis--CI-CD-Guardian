"""
API v1 router — aggregates all v1 endpoint routers.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    predictions,
    repositories,
    intelligence,
    auth,
    analysis,
    history
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(health.router, prefix="/health", tags=["System"])
api_router.include_router(repositories.router, prefix="/repositories", tags=["Repositories"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])

# Operational Analysis Endpoints
api_router.include_router(analysis.router, prefix="/analysis", tags=["Operational Analysis"])
api_router.include_router(history.router, prefix="/history", tags=["Deployment History"])

# Production Intelligence Endpoint
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
