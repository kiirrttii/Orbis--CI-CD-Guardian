"""
FastAPI application factory.

Responsibilities:
- Create and configure the FastAPI app instance
- Register middleware (CORS, request logging)
- Mount versioned API routers
- Configure lifespan (startup / shutdown hooks)
- Register global exception handlers
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.core.seeding import seed_demo_user
from app.ml.model_loader import ModelLoadError, load_model
from app.explainability.explainer import load_explainer

# Configure structured logging as the very first step
configure_logging()
logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — startup & shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown logic."""
    logger.info(
        "application_startup",
        app=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )

    # ── Load ML model ──────────────────────────────────────────────────────
    try:
        load_model()
        logger.info("ml_model_ready")
    except ModelLoadError as exc:
        # Non-fatal in development — inference endpoints return 503 if called
        logger.warning(
            "ml_model_not_available",
            reason=str(exc),
            hint="Place model.pkl in app/ml/artifacts/ or run scripts/generate_test_model.py",
        )

    # ── Load SHAP explainer ────────────────────────────────────────────────
    try:
        load_explainer()
    except Exception as exc:
        logger.warning("shap_explainer_not_available", reason=str(exc))

    # ── Seed Demo Data ─────────────────────────────────────────────────────
    from app.core.seeding import seed_all
    await seed_all()

    yield
    logger.info("application_shutdown")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "Backend API for the Risk-Aware CI/CD Decision Support System. "
            "Connects to GitHub repositories, ingests CI/CD telemetry, computes "
            "deployment risk scores, and generates explainability insights."
        ),
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
        lifespan=lifespan,
    )

    # ── Middleware ─────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Request logging middleware ─────────────────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(
            "http_request_received",
            method=request.method,
            path=request.url.path,
        )
        response = await call_next(request)
        logger.info(
            "http_response_sent",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
        )
        return response

    # ── Exception handlers ────────────────────────────────────────────────────

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        logger.warning("unhandled_value_error", error=str(exc))
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"code": "VALIDATION_ERROR", "message": str(exc)},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error("unhandled_exception", error=str(exc), exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred.",
            },
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
