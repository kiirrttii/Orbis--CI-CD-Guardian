"""
Telemetry Repository.

Handles database operations for CI/CD telemetry such as WorkflowRuns and DeploymentOutcomes.
"""

from typing import Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.workflow_run import WorkflowRun
from app.models.deployment_outcome import DeploymentOutcome

class TelemetryRepository:
    """Repository for managing CI/CD telemetry data."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_workflow_run(self, run: WorkflowRun) -> WorkflowRun:
        """Create a new workflow run record."""
        self.session.add(run)
        await self.session.flush()
        return run

    async def get_workflow_run_by_id(self, run_id: uuid.UUID) -> Optional[WorkflowRun]:
        """Retrieve a workflow run by ID."""
        stmt = select(WorkflowRun).where(WorkflowRun.id == run_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create_deployment_outcome(self, outcome: DeploymentOutcome) -> DeploymentOutcome:
        """Create a deployment outcome record."""
        self.session.add(outcome)
        await self.session.flush()
        return outcome
