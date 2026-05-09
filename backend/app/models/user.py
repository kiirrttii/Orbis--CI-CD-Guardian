"""
User ORM model.
Stores authentication credentials and basic profile info.
"""

from typing import Optional
from sqlalchemy import String, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.mutable import MutableDict

from app.models.base import BaseModel


class User(BaseModel):
    """
    Platform user account for authentication and authorization.
    """
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # New fields for Orbis SaaS
    role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="Developer")
    preferences: Mapped[dict] = mapped_column(
        MutableDict.as_mutable(JSON), 
        nullable=False, 
        server_default='{}',
        default=dict
    )
