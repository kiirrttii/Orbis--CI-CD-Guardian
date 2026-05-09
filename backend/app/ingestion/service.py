"""
Telemetry Ingestion Service.

Orchestrates the fetching of telemetry data from all configured adapters.
"""

from typing import List

from app.core.logging import get_logger
from app.ingestion.models import TelemetryPayload
from app.ingestion.adapters import MockGitHubActionsAdapter, MockJenkinsAdapter

logger = get_logger(__name__)

async def ingest_all_telemetry() -> List[TelemetryPayload]:
    """
    Fetch and normalize telemetry from all CI/CD sources.
    """
    logger.info("ingestion_started")
    
    adapters = [
        MockGitHubActionsAdapter(),
        MockJenkinsAdapter()
    ]
    
    all_payloads = []
    
    for adapter in adapters:
        try:
            payloads = await adapter.fetch_telemetry()
            all_payloads.extend(payloads)
        except Exception as exc:
            logger.error("adapter_fetch_failed", adapter=type(adapter).__name__, error=str(exc))
            
    logger.info("ingestion_completed", total_records=len(all_payloads))
    return all_payloads
