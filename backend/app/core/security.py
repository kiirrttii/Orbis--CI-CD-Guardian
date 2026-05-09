"""
Security and cryptographic utilities.
Handles password hashing and JWT token generation.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using bcrypt.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against a hash.
    """
    print(f"[Security] Verifying password. Plain length: {len(plain_password)}")
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"[Security] Verification result: {result}")
        return result
    except Exception as e:
        print(f"[Security] Verification ERROR: {str(e)}")
        return False


def create_access_token(
    subject: str, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token for the given subject (user ID).
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt
