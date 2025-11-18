"""Application configuration management."""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Container for environment-driven configuration."""

    def __init__(self) -> None:
        # Database configuration
        try:
            self.database_url: str = os.environ["DATABASE_URL"]
        except KeyError as exc:  # pragma: no cover - defensive programming
            raise RuntimeError(
                "DATABASE_URL must be defined; configure your environment before starting the app."
            ) from exc

        # Database pool settings (optimized for high concurrency)
        self.db_pool_size: int = int(os.getenv("DB_POOL_SIZE", "20"))
        self.db_max_overflow: int = int(os.getenv("DB_MAX_OVERFLOW", "40"))
        self.db_pool_recycle: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))
        self.db_pool_pre_ping: bool = os.getenv("DB_POOL_PRE_PING", "true").lower() == "true"

        # Redis configuration
        self.redis_url: str = os.getenv("REDIS_URL", "redis://redis:6379")
        self.cache_enabled: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
        self.cache_ttl_default: int = int(os.getenv("CACHE_TTL_DEFAULT", "3600"))

        # JWT & Security
        self.jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
        self.jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_access_token_expire_minutes: int = int(
            os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )

        # API configuration
        self.api_v1_prefix: str = "/api/v1"
        self.project_name: str = "Agro ML API"
        self.version: str = "2.0.0"

        # CORS
        self.cors_origins: list[str] = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:4200,http://127.0.0.1:4200"
        ).split(",")

        # Logging
        self.log_level: str = os.getenv("LOG_LEVEL", "INFO")

        # External API
        self.main_system_api_url: Optional[str] = os.getenv("MAIN_SYSTEM_API_URL")
        self.main_system_api_timeout: int = int(os.getenv("MAIN_SYSTEM_API_TIMEOUT", "30"))


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance to avoid repeated environment parsing."""

    return Settings()


settings: Settings = get_settings()


__all__: tuple[str, ...] = ("settings", "get_settings", "Settings")
