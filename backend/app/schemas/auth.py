"""
Authentication schemas.
"""

from typing import Optional
import uuid
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """
    Credentials for login.
    """
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="Plaintext password")


class UserResponse(BaseModel):
    """
    Public user profile information.
    """
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None


class TokenResponse(BaseModel):
    """
    JWT token and metadata.
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token expiration in seconds")
    user: UserResponse


class VerifyResponse(BaseModel):
    """
    Token verification result.
    """
    valid: bool
    user: UserResponse


class SignupRequest(BaseModel):
    """
    Data for user registration.
    """
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
