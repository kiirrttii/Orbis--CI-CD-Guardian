import uuid
from sqlalchemy import String, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class ContextRelation(BaseModel):
    __tablename__ = "context_relations"

    source_event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orchestration_events.id"), nullable=False, index=True)
    related_event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orchestration_events.id"), nullable=False, index=True)
    
    relation_type: Mapped[str] = mapped_column(String, nullable=False) # causal, temporal, suspected_root_cause
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    impact_level: Mapped[str] = mapped_column(String, nullable=True) # e.g. HIGH, MEDIUM, LOW

    # Relationships
    source_event: Mapped["OrchestrationEvent"] = relationship(foreign_keys=[source_event_id])
    related_event: Mapped["OrchestrationEvent"] = relationship(foreign_keys=[related_event_id])
