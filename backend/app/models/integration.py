from sqlalchemy import String, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from typing import Any
import datetime

class Integration(BaseModel):
    __tablename__ = "integrations"

    tool_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True) # CI/CD & Automation, Security & Code Quality, etc.
    base_url: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="disconnected")
    auth_config: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=True)
    last_sync: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    # events: Mapped[list["OrchestrationEvent"]] = relationship(back_populates="integration")
