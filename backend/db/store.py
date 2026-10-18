"""
Selects the active storage backend (see config.STORAGE_BACKEND) and exposes
it through get_store(). Routers call get_store() and use the returned
object's methods — they never import db.json_store / db.sql_store directly,
so the same router code works against either backend.
"""

from config import STORAGE_BACKEND

if STORAGE_BACKEND == "postgres":
    from .sql_store import sql_store as _store
else:
    from .json_store import json_store as _store


def get_store():
    return _store


def init_storage() -> None:
    """Create tables (Postgres) or no-op (JSON — file is created lazily)."""
    if STORAGE_BACKEND == "postgres":
        _store.init_tables()
