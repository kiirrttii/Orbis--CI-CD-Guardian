from typing import Optional, Literal, Dict, Any
import uuid
from pydantic import BaseModel, EmailStr, Field

class UserPreferences(BaseModel):
    version: int = 1
    theme: Literal["light", "dark", "system"] = "system"
    notifications: bool = True
    export_format: Literal["pdf", "csv", "json"] = "pdf"
    refresh_interval: int = Field(30, ge=5, le=3600)
    
    # Feature flags placeholder
    experimental_features: Dict[str, bool] = Field(default_factory=dict)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[Literal["Developer", "Analyst", "Viewer", "Administrator"]] = None
    preferences: Optional[UserPreferences] = None

class UserDetailedResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    role: Optional[str] = None
    preferences: UserPreferences
    created_at: str
    updated_at: str
