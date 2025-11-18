"""
HTTP client pool for efficient external API calls
"""
import httpx
from typing import Optional
import structlog

from app.core.config import settings

logger = structlog.get_logger()


class HTTPClientPool:
    """Singleton HTTP client pool with connection reuse and HTTP/2 support"""

    _client: Optional[httpx.AsyncClient] = None

    @classmethod
    async def get_client(cls) -> httpx.AsyncClient:
        """
        Get or create the shared HTTP client instance

        Returns:
            httpx.AsyncClient configured with connection pooling

        Note:
            This client should be closed on application shutdown using close()
        """
        if cls._client is None:
            cls._client = httpx.AsyncClient(
                # Timeout configuration
                timeout=httpx.Timeout(
                    timeout=settings.main_system_api_timeout,
                    connect=10.0,
                    read=30.0,
                    write=10.0,
                    pool=5.0,
                ),
                # Connection limits for pooling
                limits=httpx.Limits(
                    max_keepalive_connections=20,
                    max_connections=100,
                    keepalive_expiry=30.0,
                ),
                # Performance features
                http2=True,                    # Enable HTTP/2
                follow_redirects=True,
                # Headers
                headers={
                    "User-Agent": f"{settings.project_name}/{settings.version}",
                },
            )
            logger.info("http_client_pool_initialized")

        return cls._client

    @classmethod
    async def close(cls):
        """
        Close the HTTP client and release all connections

        Should be called on application shutdown
        """
        if cls._client:
            await cls._client.aclose()
            cls._client = None
            logger.info("http_client_pool_closed")
