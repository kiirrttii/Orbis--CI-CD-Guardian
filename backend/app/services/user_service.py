import structlog
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.user import UserUpdate, UserPreferences, UserDetailedResponse
from app.core.errors import AppError, ErrorCode
from app.core.events import event_emitter, UserProfileUpdated, PreferencesChanged, UserRoleChangeRejected

logger = structlog.get_logger(__name__)

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, user_id: Any) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def update_user(self, user: User, update_data: UserUpdate) -> User:
        """
        Safely update user profile and preferences with validation and domain events.
        """
        payload = update_data.model_dump(exclude_unset=True)
        if not payload:
            return user

        changes = {}
        
        # 1. Email Collision Check
        if "email" in payload and payload["email"] != user.email:
            existing_user = await self.db.execute(
                select(User).where(User.email == payload["email"])
            )
            if existing_user.scalars().first():
                raise AppError(
                    message="Email already in use by another account.",
                    code=ErrorCode.CONFLICT_ERROR
                )
            changes["email"] = payload["email"]
            user.email = payload["email"]

        # 2. Role Security Boundary
        if "role" in payload and payload["role"] != user.role:
            if payload["role"] == "Administrator":
                # Principal Refinement: Prevent self-promotion to Admin
                await event_emitter.emit(UserRoleChangeRejected(
                    user_id=str(user.id),
                    attempted_role="Administrator",
                    reason="Self-promotion not allowed"
                ))
                raise AppError(
                    message="Cannot self-promote to Administrator role.",
                    code=ErrorCode.AUTHORIZATION_ERROR
                )
            changes["role"] = payload["role"]
            user.role = payload["role"]

        # 3. Preferences Update & Migration
        if "preferences" in payload:
            old_prefs = user.preferences or {}
            new_prefs_data = payload["preferences"]
            
            # Idempotency check
            if old_prefs != new_prefs_data:
                # Migration Logic (Defensive Reading)
                final_prefs = self._migrate_preferences(old_prefs, UserPreferences(**new_prefs_data))
                user.preferences = final_prefs
                changes["preferences"] = "updated"
                await event_emitter.emit(PreferencesChanged(user_id=str(user.id), version=final_prefs["version"]))

        # 4. Standard Profile Fields
        if "full_name" in payload and payload["full_name"] != user.full_name:
            changes["full_name"] = payload["full_name"]
            user.full_name = payload["full_name"]

        # 5. Persistence with Transaction Safety
        if changes:
            try:
                await self.db.commit()
                await self.db.refresh(user)
                
                # Dispatch Domain Event
                await event_emitter.emit(UserProfileUpdated(user_id=str(user.id), changes=changes))
                logger.info("user_updated_successfully", user_id=str(user.id), fields=list(changes.keys()))
            except Exception as exc:
                await self.db.rollback()
                logger.error("user_update_failed", user_id=str(user.id), error=str(exc))
                raise AppError(
                    message="Failed to persist user changes.",
                    code=ErrorCode.PERSISTENCE_ERROR
                )

        return user

    def _migrate_preferences(self, old_prefs: Dict[str, Any], new_prefs: UserPreferences) -> Dict[str, Any]:
        """
        Ensures preferences are correctly versioned and defaults applied.
        """
        final = new_prefs.model_dump()
        
        # Logic for schema evolution could go here
        # For now, we ensure version is at least 1
        if final.get("version", 0) < 1:
            final["version"] = 1
            
        return final

    def map_to_detailed_response(self, user: User) -> UserDetailedResponse:
        """
        DTO Mapping: ORM -> API DTO
        """
        # Defensive check for NULL preferences
        prefs = user.preferences or {}
        if not prefs:
            prefs = {"version": 1, "theme": "system", "notifications": True, "export_format": "pdf", "refresh_interval": 30}
            
        return UserDetailedResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            preferences=UserPreferences(**prefs),
            created_at=user.created_at.isoformat(),
            updated_at=user.updated_at.isoformat()
        )
