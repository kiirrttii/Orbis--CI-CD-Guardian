"""
Common Pydantic schemas reused across the API.
"""

import uuid
from datetime import datetime
from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    """Standard envelope for all API responses."""

    success: bool = True
    message: Optional[str] = None
    data: Optional[DataT] = None


class PaginatedResponse(BaseModel, Generic[DataT]):
    """Paginated list response envelope."""

    items: List[DataT]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorDetail(BaseModel):
    """Structured error response body."""

    code: str
    message: str
    details: Optional[dict] = None


class TimestampSchema(BaseModel):
    """Mixin providing timestamp fields for read schemas."""

    model_config = ConfigDict(from_attributes=True)

    created_at: datetime
    updated_at: datetime


class UUIDSchema(BaseModel):
    """Mixin providing a UUID id field for read schemas."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
