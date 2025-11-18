"""
Redis client configuration and utilities for caching
"""
import json
import os
from functools import wraps
from typing import Any, Callable, Optional
from redis.asyncio import Redis, ConnectionPool
import structlog

logger = structlog.get_logger()


class RedisClient:
    """Singleton Redis client with connection pooling"""

    _instance: Optional['RedisClient'] = None
    _redis: Optional[Redis] = None
    _pool: Optional[ConnectionPool] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    async def initialize(cls) -> 'RedisClient':
        """Initialize Redis connection pool"""
        if cls._redis is None:
            redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')

            cls._pool = ConnectionPool.from_url(
                redis_url,
                decode_responses=True,
                max_connections=50,
                socket_connect_timeout=5,
                socket_keepalive=True,
            )

            cls._redis = Redis(connection_pool=cls._pool)

            try:
                await cls._redis.ping()
                logger.info("redis_connection_established", url=redis_url)
            except Exception as exc:
                logger.error("redis_connection_failed", error=str(exc))
                raise

        return cls._instance

    @classmethod
    async def get_client(cls) -> Redis:
        """Get Redis client instance"""
        if cls._redis is None:
            await cls.initialize()
        return cls._redis

    @classmethod
    async def close(cls):
        """Close Redis connection"""
        if cls._redis:
            await cls._redis.aclose()
            cls._redis = None
        if cls._pool:
            await cls._pool.disconnect()
            cls._pool = None


def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """
    Decorator to cache function results in Redis

    Args:
        ttl: Time to live in seconds (default: 1 hour)
        key_prefix: Prefix for cache key

    Example:
        @cache_result(ttl=1800, key_prefix="predictions")
        async def get_predictions(lote_id: str):
            # ...expensive operation...
            return results
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Build cache key
            key_parts = [
                key_prefix or func.__name__,
                str(args) if args else "",
                str(sorted(kwargs.items())) if kwargs else ""
            ]
            cache_key = ":".join(filter(None, key_parts))

            try:
                redis = await RedisClient.get_client()

                # Try to get from cache
                cached_value = await redis.get(cache_key)
                if cached_value:
                    logger.debug(
                        "cache_hit",
                        function=func.__name__,
                        key=cache_key
                    )
                    return json.loads(cached_value)

                # Cache miss - execute function
                logger.debug(
                    "cache_miss",
                    function=func.__name__,
                    key=cache_key
                )
                result = await func(*args, **kwargs)

                # Store in cache
                await redis.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )

                return result

            except Exception as exc:
                logger.warning(
                    "cache_error_fallback_to_direct",
                    function=func.__name__,
                    error=str(exc)
                )
                # If caching fails, execute function anyway
                return await func(*args, **kwargs)

        return wrapper
    return decorator


async def invalidate_cache_pattern(pattern: str):
    """
    Invalidate all cache keys matching a pattern

    Args:
        pattern: Redis pattern (e.g., "predictions:*")
    """
    try:
        redis = await RedisClient.get_client()
        cursor = 0
        deleted_count = 0

        while True:
            cursor, keys = await redis.scan(cursor, match=pattern, count=100)
            if keys:
                deleted = await redis.delete(*keys)
                deleted_count += deleted

            if cursor == 0:
                break

        logger.info(
            "cache_invalidated",
            pattern=pattern,
            deleted_count=deleted_count
        )
        return deleted_count

    except Exception as exc:
        logger.error("cache_invalidation_failed", pattern=pattern, error=str(exc))
        raise
