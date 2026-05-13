import uuid
from typing import Any
from sqlalchemy import String, JSON, Integer, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class OrchestrationEvent(BaseModel):
    __tablename__ = "orchestration_events"

    integration_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("integrations.id"), nullable=True, index=True)
    service_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("service_registry.id"), nullable=True, index=True)
    
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True) # e.g. pipeline_failed, playbook_executed
    source: Mapped[str] = mapped_column(String, nullable=False) # Jenkins, Ansible
    severity: Mapped[str] = mapped_column(String, nullable=False, default="INFO") # INFO, WARNING, ERROR, CRITICAL
    status: Mapped[str] = mapped_column(String, nullable=True) # success, failed
    
    normalized_data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=True)
    operational_impact: Mapped[int] = mapped_column(Integer, nullable=True)

    # Relationships
    integration: Mapped["Integration"] = relationship()
    service: Mapped["ServiceRegistry"] = relationship()
