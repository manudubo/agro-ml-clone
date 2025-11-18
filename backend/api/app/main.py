from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from .controllers.recommendations_controller import router as recommendations_router
from .controllers.lotes_controller import router as lotes_router
from .controllers.health_controller import router as health_router
from .middleware.auth import AuthMiddleware
from .core.config import settings
from .cache.redis_client import RedisClient
from .clients.http_pool import HTTPClientPool
from .db.session import dispose_engine

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events - startup and shutdown

    Initializes connections on startup and gracefully closes them on shutdown
    """
    # Startup
    logger.info("application_starting", version=settings.version)

    try:
        # Initialize Redis connection
        if settings.cache_enabled:
            await RedisClient.initialize()
            logger.info("redis_initialized")

        # Initialize HTTP client pool
        await HTTPClientPool.get_client()
        logger.info("http_client_pool_initialized")

        # Optional: Warmup model cache here if needed
        # from .services.siembra.model_cache import ModelCache
        # from .services.siembra.model_loader import ModelLoader
        # await ModelCache.warmup(ModelLoader())

        logger.info("application_ready")

    except Exception as exc:
        logger.error("application_startup_failed", error=str(exc))
        raise

    yield  # Application runs

    # Shutdown
    logger.info("application_shutting_down")

    try:
        # Close Redis connection
        if settings.cache_enabled:
            await RedisClient.close()
            logger.info("redis_closed")

        # Close HTTP client pool
        await HTTPClientPool.close()
        logger.info("http_client_pool_closed")

        # Dispose database engine
        await dispose_engine()
        logger.info("database_engine_disposed")

        logger.info("application_shutdown_complete")

    except Exception as exc:
        logger.error("application_shutdown_error", error=str(exc))


app = FastAPI(
    title=settings.project_name,
    version=settings.version,
    description="API modernizada para recomendaciones agronomicas con ML",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS middleware - using configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

# Authentication middleware
app.add_middleware(AuthMiddleware)

# Register routers
app.include_router(recommendations_router, prefix=settings.api_v1_prefix)
app.include_router(health_router)  # No prefix for health check
app.include_router(lotes_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": settings.project_name,
        "version": settings.version,
        "docs": "/api/docs",
        "health": "/health",
    }
