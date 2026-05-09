"""
Database seeding utilities.
"""

from sqlalchemy import select
from app.core.logging import get_logger
from app.core.security import hash_password
from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.repository import Repository, ConnectionStatus
from app.models.workflow_run import WorkflowRun, WorkflowRunStatus, WorkflowRunConclusion
import uuid
from datetime import datetime, timezone

logger = get_logger(__name__)

async def seed_demo_user():
    """
    Creates a demo admin user if it doesn't already exist.
    """
    admin_email = "admin@orbis.ai"
    admin_password = "Orbis123"
    
    async with AsyncSessionLocal() as session:
        try:
            stmt = select(User).where(User.email == admin_email)
            result = await session.execute(stmt)
            user = result.scalars().first()
            
            if not user:
                logger.info("seeding_demo_user", email=admin_email)
                new_user = User(
                    email=admin_email,
                    hashed_password=hash_password(admin_password),
                    full_name="Orbis Admin",
                    is_active=True
                )
                session.add(new_user)
                await session.commit()
                logger.info("demo_user_created")
            else:
                logger.info("demo_user_already_exists")
        except Exception as exc:
            logger.error("seeding_failed", error=str(exc))
            await session.rollback()

async def seed_mock_telemetry():
    """
    Seeds mock repository and telemetry data matching frontend UUIDs.
    """
    mock_repo_url = "https://github.com/demo/orbis-demo"
    mock_runs = [
        {"id": "5c21504d-9383-4419-ab64-cba3e6d7dfdb", "name": "Build and Deploy - Main"},
        {"id": "21aa7db1-3904-47cb-9570-7beb924b7941", "name": "Run Tests - PR"},
        {"id": "94bb85ec-1e25-45ae-974b-f665c8933b81", "name": "Nightly Build"},
        {"id": "9fe692f8-40e5-419e-87a4-1bc65c7919a2", "name": "Security Scan"},
        {"id": "6c1c615c-e09d-4f5d-afe1-d8defb142e73", "name": "Deploy to Staging"},
    ]
    
    async with AsyncSessionLocal() as session:
        try:
            # 1. Create Mock Repository
            stmt = select(Repository).where(Repository.repo_url == mock_repo_url)
            result = await session.execute(stmt)
            repo = result.scalars().first()
            
            if not repo:
                repo = Repository(
                    repo_url=mock_repo_url,
                    owner="demo",
                    name="orbis-demo",
                    full_name="demo/orbis-demo",
                    connection_status=ConnectionStatus.CONNECTED,
                    is_active=True
                )
                session.add(repo)
                await session.flush() # Get repo.id
                logger.info("mock_repository_seeded")
            
            # 2. Create Mock Workflow Runs
            for run_data in mock_runs:
                run_id = uuid.UUID(run_data["id"])
                stmt = select(WorkflowRun).where(WorkflowRun.id == run_id)
                result = await session.execute(stmt)
                existing_run = result.scalars().first()
                
                if not existing_run:
                    new_run = WorkflowRun(
                        id=run_id,
                        repository_id=repo.id,
                        github_run_id=int(run_id.int >> 96), # Dummy GH ID
                        workflow_name=run_data["name"],
                        status=WorkflowRunStatus.COMPLETED,
                        conclusion=WorkflowRunConclusion.SUCCESS,
                        started_at=datetime.now(timezone.utc),
                        completed_at=datetime.now(timezone.utc),
                        duration_seconds=300
                    )
                    session.add(new_run)
            
            await session.commit()
            logger.info("mock_telemetry_seeded")
        except Exception as exc:
            logger.error("mock_seeding_failed", error=str(exc))
            await session.rollback()

async def seed_all():
    """Seed all demo data."""
    await seed_demo_user()
    await seed_mock_telemetry()
