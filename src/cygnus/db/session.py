"""Database engine and session factory (Phase 6)."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from cygnus.config import get_settings
from cygnus.db.models import Base


_engine = None
_session_factory = None


def get_engine():
    """Create or return the SQLAlchemy engine. Uses DATABASE_URL from settings."""
    global _engine
    if _engine is not None:
        return _engine
    settings = get_settings()
    url = settings.database_url
    if not url:
        raise ValueError("DATABASE_URL is not set")
    _engine = create_engine(url, echo=False, future=True)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    """Return session factory. Call get_engine() first or ensure DATABASE_URL is set."""
    global _session_factory
    if _session_factory is not None:
        return _session_factory
    engine = get_engine()
    _session_factory = sessionmaker(engine, expire_on_commit=False, autoflush=False)
    return _session_factory


def init_db() -> None:
    """Create all tables. Safe to call if they already exist."""
    engine = get_engine()
    Base.metadata.create_all(engine)
