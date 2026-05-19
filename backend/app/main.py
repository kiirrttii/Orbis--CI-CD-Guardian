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
from app.core.errors import AppError
import uuid

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

    # ── Request logging & Tracing middleware ───────────────────────────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=request_id)
        
        logger.info(
            "http_request_received",
            method=request.method,
            path=request.url.path,
        )
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        logger.info(
            "http_response_sent",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
        )
        return response

    # ── Exception handlers ────────────────────────────────────────────────────

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        logger.warning("application_error", code=exc.code, message=exc.message)
        status_map = {
            "VALIDATION_ERROR": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "AUTHORIZATION_ERROR": status.HTTP_403_FORBIDDEN,
            "AUTHENTICATION_ERROR": status.HTTP_401_UNAUTHORIZED,
            "NOT_FOUND_ERROR": status.HTTP_404_NOT_FOUND,
            "CONFLICT_ERROR": status.HTTP_409_CONFLICT,
            "PERSISTENCE_ERROR": status.HTTP_500_INTERNAL_SERVER_ERROR,
        }
        status_code = status_map.get(exc.code, status.HTTP_400_BAD_REQUEST)
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            },
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        error_msg = str(exc)
        # Check if the error message looks like an internal library error
        # Bcrypt/Passlib errors or other library-specific messages should be masked
        internal_patterns = ["password cannot be longer than", "bcrypt", "crypt_context"]
        if any(p in error_msg.lower() for p in internal_patterns):
            logger.error("internal_validation_error", error=error_msg, exc_info=True)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "code": "INTERNAL_ERROR",
                    "message": "Something went wrong. Please try again later.",
                },
            )
        
        logger.warning("unhandled_value_error", error=error_msg)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"code": "VALIDATION_ERROR", "message": error_msg},
        )

    from sqlalchemy.exc import SQLAlchemyError
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        # Log the real error for server-side debugging
        logger.error("database_integrity_error", error=str(exc), exc_info=True)
        # Return a safe, generic message to the user
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "DATABASE_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error("unhandled_exception", error=str(exc), exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong. Please try again later.",
            },
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
