"""Alembic environment: use DATABASE_URL from settings."""

import os
import sys

# Add project root and src so cygnus is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

from alembic import context
from sqlalchemy import engine_from_config, pool

from cygnus.config import get_settings
from cygnus.db.models import Base

config = context.config
if config.config_file_name is not None:
    file_config = config.get_section(config.config_ini_section) or {}
else:
    file_config = {}
# Override sqlalchemy.url with DATABASE_URL from env/settings
url = get_settings().database_url or os.getenv("DATABASE_URL") or file_config.get("sqlalchemy.url")
if url:
    config.set_main_option("sqlalchemy.url", url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (with DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
