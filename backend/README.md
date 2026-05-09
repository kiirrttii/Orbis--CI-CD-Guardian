# Risk-Aware CI/CD Decision Support System — Backend

> An industry-grade, AI-assisted platform that connects to GitHub repositories,
> ingests CI/CD telemetry, computes deployment risk features, and runs ML-based
> failure prediction with explainability insights.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Local)](#quick-start-local)
- [Quick Start (Docker)](#quick-start-docker)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Development Workflow](#development-workflow)
- [Roadmap](#roadmap)

---

## Architecture Overview

```
GitHub Repos ──► Repository Onboarding API
                     │
                     ▼
             PostgreSQL (SQLAlchemy)
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
     Ingestion  Feature Eng.    ML Inference   (Phase 2/3)
                                     │
                                 Explainability (Phase 3)
                                     │
                               Recommendations (Phase 4)
```

The backend follows a strict layered architecture:

```
Router (thin) → Service (business logic) → Repository (DB access) → ORM Model
                      │
                 GitHub Client (integrations)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Framework | FastAPI 0.111 |
| Language | Python 3.11+ |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| HTTP Client | httpx (async) |
| Logging | structlog |
| Testing | pytest + pytest-asyncio |
| Linting | ruff + mypy |
| Containerisation | Docker + docker-compose |

---

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── router.py           # Aggregates all v1 routers
│   │       └── endpoints/
│   │           ├── health.py       # GET /health, GET /health/db
│   │           └── repositories.py # Repository onboarding endpoints
│   ├── core/
│   │   ├── config.py               # Pydantic BaseSettings (env-driven)
│   │   └── logging.py              # structlog configuration
│   ├── integrations/
│   │   └── github/
│   │       └── client.py           # Async GitHub REST API client
│   ├── ingestion/                  # Phase 2: telemetry ingestion
│   ├── feature_engineering/        # Phase 2: feature extraction
│   ├── ml/                         # Phase 3: model inference
│   ├── explainability/             # Phase 3: SHAP explanations
│   ├── recommendations/            # Phase 4: AI recommendations
│   ├── database/
│   │   ├── base.py                 # SQLAlchemy DeclarativeBase
│   │   └── session.py              # Async engine + get_db dependency
│   ├── models/                     # ORM models (all 8 entities)
│   ├── schemas/                    # Pydantic request/response schemas
│   ├── services/                   # Business logic layer
│   ├── repositories/               # Data access layer (Repository pattern)
│   ├── utils/                      # Shared utilities & validators
│   └── main.py                     # FastAPI app factory
├── alembic/                        # Alembic migrations
├── tests/                          # pytest test suite
├── requirements/
│   ├── base.txt                    # Core dependencies
│   ├── dev.txt                     # Dev + test dependencies
│   └── prod.txt                    # Production extras
├── Dockerfile                      # Multi-stage Docker build
├── alembic.ini                     # Alembic config
├── pyproject.toml                  # pytest + ruff + mypy config
└── .env.example                    # Environment template
```

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- PostgreSQL 16 running locally
- `pip` or `uv`

```bash
# 1. Clone and enter project
cd backend/

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows

# 3. Install development dependencies
pip install -r requirements/dev.txt

# 4. Configure environment
cp .env.example .env
# Edit .env — set POSTGRES_* credentials

# 5. Run database migrations
alembic upgrade head

# 6. Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be live at: http://localhost:8000
Swagger UI: http://localhost:8000/docs (DEBUG=true only)

---

## Quick Start (Docker)

```bash
# From the project root (where docker-compose.yml lives)
cp backend/.env.example backend/.env
# Edit backend/.env if needed

# Start all services (DB + migrations + API)
docker-compose up --build

# Run migrations only
docker-compose run --rm migrate
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DEBUG` | `false` | Enable Swagger UI and verbose logs |
| `ENVIRONMENT` | `development` | `development` / `staging` / `production` |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `cicd_user` | DB username |
| `POSTGRES_PASSWORD` | `cicd_password` | DB password |
| `POSTGRES_DB` | `cicd_risk_db` | Database name |
| `GITHUB_API_TIMEOUT` | `30` | GitHub API request timeout (seconds) |
| `GITHUB_MAX_RETRIES` | `3` | Max retries on rate limit |
| `SECRET_KEY` | — | App secret (generate with `openssl rand -hex 32`) |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `LOG_FORMAT` | `json` | `json` (production) or `text` (development) |

---

## Database Migrations

```bash
# Generate a new migration (autogenerate from model changes)
alembic revision --autogenerate -m "describe your change"

# Apply all pending migrations
alembic upgrade head

# Downgrade one step
alembic downgrade -1

# View migration history
alembic history --verbose
```

---

## API Reference

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Liveness probe |
| `GET` | `/api/v1/health/db` | Readiness probe (DB ping) |

### Repositories

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/repositories/connect` | Connect a GitHub repository |
| `GET` | `/api/v1/repositories` | List all connected repositories |
| `GET` | `/api/v1/repositories/{id}` | Get repository details by UUID |

#### Connect Repository

```http
POST /api/v1/repositories/connect
Content-Type: application/json

{
  "repo_url": "https://github.com/org/project",
  "github_token": "ghp_...",
  "branch": "main"
}
```

**Response 201:**
```json
{
  "repository_id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "org/project",
  "connection_status": "connected",
  "message": "Repository connected successfully."
}
```

---

## Running Tests

```bash
# Install dev dependencies (if not already)
pip install -r requirements/dev.txt

# Run all tests
pytest

# With coverage report
pytest --cov=app --cov-report=term-missing

# Run a specific test file
pytest tests/test_repositories.py -v
```

---

## Development Workflow

```bash
# Lint and format
ruff check app/ tests/
ruff format app/ tests/

# Type checking
mypy app/

# Generate migration after model changes
alembic revision --autogenerate -m "add_xyz_table"
alembic upgrade head
```

---

## Roadmap

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | ✅ Complete | Backend foundation + repository onboarding |
| **Phase 2** | 🔲 Planned | CI/CD telemetry ingestion + feature extraction |
| **Phase 3** | 🔲 Planned | ML risk scoring + SHAP explainability |
| **Phase 4** | 🔲 Planned | AI-assisted recommendations |
| **Phase 5** | 🔲 Planned | Dashboard frontend + Prometheus/Grafana |

---

## Database Models

| Model | Table | Description |
|---|---|---|
| `Repository` | `repositories` | Connected GitHub repos |
| `WorkflowRun` | `workflow_runs` | GitHub Actions workflow executions |
| `Commit` | `commits` | Git commits linked to runs |
| `ExtractedFeature` | `extracted_features` | ML feature vectors per run |
| `Prediction` | `predictions` | ML risk scores per run |
| `FeatureContribution` | `feature_contributions` | SHAP values per prediction |
| `Recommendation` | `recommendations` | AI-generated recommendations |
| `DeploymentOutcome` | `deployment_outcomes` | Ground-truth outcomes for retraining |

---

*Built with ❤️ for production-grade DevSecOps.*
