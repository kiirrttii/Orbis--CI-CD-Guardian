"""
Telemetry Adapters.

Mock adapters that read from local JSON files to simulate CI/CD ingestion.
Prepares the system for real GitHub/Jenkins API integration.
"""

import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List
import aiofiles

from app.ingestion.models import TelemetryPayload

MOCK_DATA_DIR = Path(__file__).parent.parent.parent / "mock_data"

class TelemetryAdapter(ABC):
    """Base class for telemetry adapters."""
    
    @abstractmethod
    async def fetch_telemetry(self) -> List[TelemetryPayload]:
        pass


class MockGitHubActionsAdapter(TelemetryAdapter):
    
    async def fetch_telemetry(self) -> List[TelemetryPayload]:
        file_path = MOCK_DATA_DIR / "github_runs.json"
        if not file_path.exists():
            return []
            
        async with aiofiles.open(file_path, "r") as f:
            content = await f.read()
            data = json.loads(content)
            
        results = []
        for run in data:
            results.append(
                TelemetryPayload(
                    source_id=run["id"],
                    source_system="github",
                    status=run.get("conclusion", run["status"]),
                    repository_id=run["repository_id"],
                    metrics=run["metrics"]
                )
            )
        return results


class MockJenkinsAdapter(TelemetryAdapter):
    
    async def fetch_telemetry(self) -> List[TelemetryPayload]:
        file_path = MOCK_DATA_DIR / "jenkins_runs.json"
        if not file_path.exists():
            return []
            
        async with aiofiles.open(file_path, "r") as f:
            content = await f.read()
            data = json.loads(content)
            
        results = []
        for run in data:
            results.append(
                TelemetryPayload(
                    source_id=run["id"],
                    source_system="jenkins",
                    status=run["status"].lower(),
                    repository_id=run["repository_id"],
                    metrics=run["metrics"]
                )
            )
        return results
