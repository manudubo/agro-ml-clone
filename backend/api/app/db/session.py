"""Database session management using SQLAlchemy async engine with optimized connection pooling."""
from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
import structlog

from app.core.config import settings

logger = structlog.get_logger()

# Create async engine with optimized connection pooling
engine: AsyncEngine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    # Connection pool configuration for high concurrency
    pool_size=settings.db_pool_size,              # Base pool size (20)
    max_overflow=settings.db_max_overflow,        # Additional connections (40)
    pool_recycle=settings.db_pool_recycle,        # Recycle connections every hour
    pool_pre_ping=settings.db_pool_pre_ping,      # Verify connections before use
    # Performance optimizations
    pool_use_lifo=True,                           # Use LIFO for better connection reuse
    connect_args={
        "server_settings": {
            "application_name": "agro_ml_api",
            "jit": "on",                          # Enable JIT compilation in PostgreSQL
        },
        "command_timeout": 60,                     # Query timeout (seconds)
        "timeout": 10,                             # Connection timeout (seconds)
    },
)

async_session_factory = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,                               # Manual flush control for performance
)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    """Provide a transactional scope around a series of operations."""

    async with async_session_factory() as session:
        try:
            yield session
        except Exception as exc:
            logger.error("database_session_error", error=str(exc))
            await session.rollback()
            raise
        finally:
            await session.close()


async def dispose_engine():
    """Dispose of the engine and close all connections. Call on application shutdown."""
    logger.info("disposing_database_engine")
    await engine.dispose()
