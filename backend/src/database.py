"""
Database Connection & Session Factory for BALLON
Supports PostgreSQL (Supabase) with fallback to SQLite for local development / testing.
"""

import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from src.config import DATABASE_URL, DATABASE_PATH

logger = logging.getLogger(__name__)

# Normalize DATABASE_URL for SQLAlchemy 2.x + psycopg 3
db_url = DATABASE_URL
if db_url:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    db_url = f"sqlite:///{DATABASE_PATH}"

# Connection arguments
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Create Engine & Session Factory
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Health check helper to verify database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning(f"Database connectivity check failed: {e}")
        return False
