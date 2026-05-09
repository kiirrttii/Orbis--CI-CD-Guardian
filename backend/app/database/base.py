"""
SQLAlchemy declarative base.
All ORM models must import and extend `Base` from this module.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Project-wide SQLAlchemy declarative base class."""

    pass
