"""
Application configuration management.
Loads settings from environment variables / .env file using Pydantic BaseSettings.
"""

from functools import lru_cache
from typing import List, Optional

from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────────────────
    APP_NAME: str = "Orbis"
    APP_DESCRIPTION: str = "Risk-Aware CI/CD Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── API ──────────────────────────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        # Render frontend (production) — add your deployed frontend domain here
        "https://orbis-frontendd.onrender.com",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # ── PostgreSQL ────────────────────────────────────────────────────────────
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "cicd_user"
    POSTGRES_PASSWORD: str = "cicd_password"
    POSTGRES_DB: str = "cicd_risk_db"

    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_url(cls, v: Optional[str], info) -> str:
        # Always ensure async engine uses asyncpg driver
        if isinstance(v, str) and v:
            if v.startswith("sqlite") and "+aiosqlite" not in v:
                return v.replace("sqlite:///", "sqlite+aiosqlite:///")
            if v.startswith("postgresql://"):
                # Convert any legacy/fallback postgresql:// to asyncpg
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
            return v
        # Build from individual components if not provided as a full URL
        data = info.data
        user = data.get("POSTGRES_USER", "cicd_user")
        password = data.get("POSTGRES_PASSWORD", "cicd_password")
        host = data.get("POSTGRES_HOST", "localhost")
        port = data.get("POSTGRES_PORT", 5432)
        db = data.get("POSTGRES_DB", "cicd_risk_db")
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Synchronous database URL (used by Alembic)."""
        if self.DATABASE_URL and "sqlite" in self.DATABASE_URL:
            return self.DATABASE_URL.replace("+aiosqlite", "")
        
        # Fallback to building from components
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── GitHub ───────────────────────────────────────────────────────────────
    GITHUB_API_BASE_URL: str = "https://api.github.com"
    GITHUB_API_TIMEOUT: int = 30  # seconds
    GITHUB_MAX_RETRIES: int = 3

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_USE_OPENSSL_RAND_HEX_32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ── Logging ──────────────────────────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json | text

    # ── Pagination ───────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()


settings = get_settings()
