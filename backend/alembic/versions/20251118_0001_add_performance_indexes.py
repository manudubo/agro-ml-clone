"""add performance indexes

Revision ID: 20251118_0001
Revises: 20250927_0001
Create Date: 2025-11-18

Adds optimized database indexes for high-performance queries
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251118_0001'
down_revision = '20250927_0001'
branch_labels = None
depends_on = None


def upgrade():
    """Add performance-optimized indexes"""

    # GIN index for JSONB queries on recomendacion_principal
    # Enables fast queries on nested JSON fields
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_prediccion_recomendacion_gin
        ON predicciones USING GIN (recomendacion_principal);
    """)

    # GIN index for alternativas JSONB
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_prediccion_alternativas_gin
        ON predicciones USING GIN (alternativas);
    """)

    # Compound index for common filter patterns (cliente + date)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_prediccion_cliente_fecha
        ON predicciones (cliente_id, fecha_creacion DESC);
    """)

    # Index for date range queries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_prediccion_fecha_creacion
        ON predicciones (fecha_creacion DESC);
    """)

    # Index for validity period queries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_prediccion_validez
        ON predicciones (valido_desde, valido_hasta)
        WHERE valido_desde IS NOT NULL AND valido_hasta IS NOT NULL;
    """)

    # Composite index for modelo_ml queries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_modelo_tipo_activo
        ON modelo_ml (tipo_modelo, es_activo, fecha_creacion DESC);
    """)

    # Index for version lookups
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_modelo_version
        ON modelo_ml (version)
        WHERE es_activo = true;
    """)

    # Partial index for active models only
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_modelo_activo
        ON modelo_ml (fecha_creacion DESC)
        WHERE es_activo = true;
    """)

    print("✓ Performance indexes created successfully")


def downgrade():
    """Remove performance indexes"""

    op.execute("DROP INDEX IF EXISTS idx_prediccion_recomendacion_gin;")
    op.execute("DROP INDEX IF EXISTS idx_prediccion_alternativas_gin;")
    op.execute("DROP INDEX IF EXISTS idx_prediccion_cliente_fecha;")
    op.execute("DROP INDEX IF EXISTS idx_prediccion_fecha_creacion;")
    op.execute("DROP INDEX IF EXISTS idx_prediccion_validez;")
    op.execute("DROP INDEX IF EXISTS idx_modelo_tipo_activo;")
    op.execute("DROP INDEX IF EXISTS idx_modelo_version;")
    op.execute("DROP INDEX IF EXISTS idx_modelo_activo;")

    print("✓ Performance indexes removed")
