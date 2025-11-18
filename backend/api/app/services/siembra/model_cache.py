"""
In-memory model cache to avoid repeated database loads
"""
import asyncio
from typing import Optional, Any, Dict, Tuple
from datetime import datetime
import structlog

logger = structlog.get_logger()


class ModelCache:
    """
    Singleton cache for ML models with version management

    Keeps trained models in memory to avoid repeated database loads.
    Includes automatic refresh on model updates.
    """

    _instance: Optional['ModelCache'] = None
    _lock: asyncio.Lock = asyncio.Lock()

    # Cache storage: {version: (model, scaler, metadata, loaded_at)}
    _models: Dict[str, Tuple[Any, Any, Dict[str, Any], datetime]] = {}

    # Default model version tracking
    _default_version: Optional[str] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    async def get_model(
        cls,
        version: Optional[str] = None
    ) -> Optional[Tuple[Any, Any, Dict[str, Any]]]:
        """
        Get model from cache or return None if not cached

        Args:
            version: Model version to retrieve. If None, uses default.

        Returns:
            Tuple of (model, scaler, metadata) or None if not cached
        """
        async with cls._lock:
            # Use default version if not specified
            if version is None:
                version = cls._default_version

            if version is None:
                logger.warning("model_cache_no_default_version")
                return None

            # Check cache
            cached = cls._models.get(version)
            if cached:
                model, scaler, metadata, loaded_at = cached
                logger.debug(
                    "model_cache_hit",
                    version=version,
                    loaded_at=loaded_at.isoformat()
                )
                return (model, scaler, metadata)

            logger.debug("model_cache_miss", version=version)
            return None

    @classmethod
    async def set_model(
        cls,
        version: str,
        model: Any,
        scaler: Any,
        metadata: Dict[str, Any],
        is_default: bool = False
    ):
        """
        Store model in cache

        Args:
            version: Model version identifier
            model: Trained ML model
            scaler: Feature scaler
            metadata: Model metadata (metrics, etc.)
            is_default: Whether this is the default model version
        """
        async with cls._lock:
            cls._models[version] = (model, scaler, metadata, datetime.utcnow())

            if is_default:
                old_default = cls._default_version
                cls._default_version = version

                logger.info(
                    "model_cache_default_updated",
                    old_version=old_default,
                    new_version=version,
                    cache_size=len(cls._models)
                )
            else:
                logger.info(
                    "model_cache_stored",
                    version=version,
                    cache_size=len(cls._models)
                )

    @classmethod
    async def invalidate(cls, version: Optional[str] = None):
        """
        Invalidate cached models

        Args:
            version: Specific version to invalidate. If None, clears all.
        """
        async with cls._lock:
            if version:
                if version in cls._models:
                    del cls._models[version]
                    logger.info("model_cache_invalidated_version", version=version)

                if cls._default_version == version:
                    cls._default_version = None
                    logger.warning("model_cache_default_cleared")
            else:
                count = len(cls._models)
                cls._models.clear()
                cls._default_version = None
                logger.info("model_cache_cleared_all", count=count)

    @classmethod
    async def get_cache_info(cls) -> Dict[str, Any]:
        """
        Get information about cached models

        Returns:
            Dictionary with cache statistics
        """
        async with cls._lock:
            return {
                "cached_versions": list(cls._models.keys()),
                "default_version": cls._default_version,
                "cache_size": len(cls._models),
                "models": [
                    {
                        "version": version,
                        "loaded_at": loaded_at.isoformat(),
                        "has_metrics": bool(metadata.get("metricas_performance")),
                    }
                    for version, (_, _, metadata, loaded_at) in cls._models.items()
                ]
            }

    @classmethod
    async def warmup(cls, model_loader):
        """
        Pre-load models into cache (warmup strategy)

        Args:
            model_loader: ModelLoader instance to load models from database

        This should be called on application startup
        """
        async with cls._lock:
            try:
                logger.info("model_cache_warmup_starting")

                # Load default model
                model_data = await model_loader.load()
                if model_data:
                    version = model_data.get("version", "default")
                    await cls.set_model(
                        version=version,
                        model=model_data["model"],
                        scaler=model_data["scaler"],
                        metadata=model_data,
                        is_default=True
                    )
                    logger.info("model_cache_warmup_completed", version=version)
                else:
                    logger.warning("model_cache_warmup_no_model_found")

            except Exception as exc:
                logger.error("model_cache_warmup_failed", error=str(exc))
                raise
