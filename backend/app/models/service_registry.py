from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

class ServiceRegistry(BaseModel):
    __tablename__ = "service_registry"

    service_name: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    environment: Mapped[str] = mapped_column(String, nullable=False, default="production", index=True)
    owning_team: Mapped[str] = mapped_column(String, nullable=True)
    criticality_level: Mapped[int] = mapped_column(Integer, default=3) # 1 (critical) to 5 (low)
    
    # Relationships
    # events: Mapped[list["OrchestrationEvent"]] = relationship(back_populates="service")
    # insights: Mapped[list["OperationalInsight"]] = relationship(back_populates="service")
