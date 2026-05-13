from typing import Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.orchestration_event import OrchestrationEvent
from app.orchestration.normalization import JenkinsNormalizer, AnsibleNormalizer
import uuid

class EventEngine:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.normalizers = {
            "Jenkins": JenkinsNormalizer(),
            "Ansible": AnsibleNormalizer()
        }

    async def process_event(self, source: str, raw_data: Dict[str, Any], integration_id: uuid.UUID = None, service_id: uuid.UUID = None):
        normalizer = self.normalizers.get(source)
        if not normalizer:
            raise ValueError(f"No normalizer found for source: {source}")

        normalized_data = normalizer.normalize(raw_data)
        
        # Determine severity and status based on normalized data
        status = normalized_data.get("result") or ("failed" if normalized_data.get("failed_hosts") else "success")
        severity = "ERROR" if status in ["failed", "FAILURE", "error"] else "INFO"
        
        event_type = f"{source.lower()}_build" if source == "Jenkins" else f"{source.lower()}_playbook"
        if status in ["failed", "FAILURE"]:
            event_type += "_failed"
        else:
            event_type += "_success"

        event = OrchestrationEvent(
            integration_id=integration_id,
            service_id=service_id,
            event_type=event_type,
            source=source,
            severity=severity,
            status=status,
            normalized_data=normalized_data,
            raw_payload=raw_data,
            operational_impact=3 if severity == "INFO" else 1
        )
        
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        
        # Trigger correlation engine here in next steps
        return event
