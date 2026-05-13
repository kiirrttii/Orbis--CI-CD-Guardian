import uuid
from sqlalchemy import String, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class OperationalInsight(BaseModel):
    __tablename__ = "operational_insights"

    service_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("service_registry.id"), nullable=True, index=True)
    
    insight_type: Mapped[str] = mapped_column(String, nullable=False, index=True) # deployment_risk, suspected_root_cause
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    severity: Mapped[str] = mapped_column(String, nullable=False, default="INFO")
    
    # Store IDs as JSON array for cross-DB compatibility
    supporting_event_ids: Mapped[list[str]] = mapped_column(JSON, default=list)

    # Relationships
    service: Mapped["ServiceRegistry"] = relationship()
