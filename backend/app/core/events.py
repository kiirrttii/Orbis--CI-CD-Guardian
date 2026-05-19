import asyncio
from typing import Any, Callable, Dict, List, Type, Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger(__name__)

@dataclass
class DomainEvent:
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

@dataclass
class UserProfileUpdated(DomainEvent):
    user_id: str = ""
    changes: Dict[str, Any] = field(default_factory=dict)

@dataclass
class PreferencesChanged(DomainEvent):
    user_id: str = ""
    version: int = 1

@dataclass
class UserRoleChangeRejected(DomainEvent):
    user_id: str = ""
    attempted_role: str = ""
    reason: str = ""

class EventEmitter:
    def __init__(self):
        self._listeners: Dict[Type[DomainEvent], List[Callable]] = {}

    def subscribe(self, event_type: Type[DomainEvent], listener: Callable):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(listener)

    async def emit(self, event: DomainEvent):
        event_type = type(event)
        if event_type in self._listeners:
            tasks = []
            for listener in self._listeners[event_type]:
                tasks.append(self._run_listener(listener, event))
            if tasks:
                await asyncio.gather(*tasks)

    async def _run_listener(self, listener: Callable, event: DomainEvent):
        try:
            if asyncio.iscoroutinefunction(listener):
                await listener(event)
            else:
                listener(event)
        except Exception as exc:
            logger.error("event_listener_failed", event=type(event).__name__, error=str(exc))

# Global event emitter instance
event_emitter = EventEmitter()

# Default listeners
def log_domain_event(event: DomainEvent):
    logger.info("domain_event_dispatched", event_type=type(event).__name__, data=vars(event))

event_emitter.subscribe(UserProfileUpdated, log_domain_event)
event_emitter.subscribe(PreferencesChanged, log_domain_event)
event_emitter.subscribe(UserRoleChangeRejected, log_domain_event)
