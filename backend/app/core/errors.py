from enum import Enum
from typing import Optional, Any, Dict

class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR"
    CONFLICT_ERROR = "CONFLICT_ERROR"
    PERSISTENCE_ERROR = "PERSISTENCE_ERROR"
    MIGRATION_ERROR = "MIGRATION_ERROR"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    TELEMETRY_ERROR = "TELEMETRY_ERROR"

class AppError(Exception):
    def __init__(
        self, 
        message: str, 
        code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)
