# Agro ML - Sistema de Recomendación Agrícola con Machine Learning

Sistema completo de recomendaciones agrícolas con Machine Learning, completamente dockerizado y listo para producción.

## 🚀 Quick Start - UN SOLO COMANDO

### Levantar el proyecto completo:
```bash
docker compose up -d
```

**Eso es todo.** El sistema va a:
- ✓ Levantar PostgreSQL 16 con PostGIS
- ✓ Levantar Redis 7 para caché
- ✓ Buildar y levantar el backend (FastAPI)
- ✓ Buildar y levantar el frontend (Angular 17)
- ✓ Aplicar migraciones automáticamente
- ✓ Entrenar modelos de ML automáticamente

### Ejecutar tests E2E automáticos:
```bash
docker compose --profile test up e2e-tests
```

**Eso es todo.** Los tests van a:
- ✓ Esperar a que el frontend y backend estén listos
- ✓ Ejecutar tests en 5 browsers (Chrome, Firefox, Safari, Mobile)
- ✓ Generar reportes HTML, JSON, JUnit y Markdown
- ✓ Mostrar resumen en consola

---

## 📋 Acceder a la Aplicación

Una vez levantado con `docker compose up -d`:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:4200 | Interfaz Angular 17 con Tailwind CSS |
| **Backend API** | http://localhost:8000 | FastAPI con docs automáticas |
| **API Docs** | http://localhost:8000/docs | Swagger UI interactivo |
| **PostgreSQL** | localhost:5432 | DB: ml_agro, User: postgres |
| **Redis** | localhost:6379 | Caché en memoria |

---

## 🧪 Ver Reportes de Tests

Después de ejecutar `docker compose --profile test up e2e-tests`:

```bash
# Ver reporte HTML interactivo (con screenshots y videos)
open frontend/playwright-report/index.html

# Ver reporte de texto
cat frontend/playwright-report/test-report.txt

# Ver reporte Markdown
cat frontend/playwright-report/test-report.md
```

---

## 🛠 Comandos Útiles

### Ver logs de todos los servicios:
```bash
docker compose logs -f
```

### Ver logs de un servicio específico:
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f e2e-tests
```

### Re-ejecutar tests:
```bash
docker compose --profile test up e2e-tests --force-recreate
```

### Rebuild completo (si algo falla):
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Ver estado de los servicios:
```bash
docker compose ps
```

### Detener todo:
```bash
docker compose down
```

### Detener y eliminar volúmenes (resetear DB):
```bash
docker compose down -v
```

---

## 🏗 Arquitectura del Sistema

### Backend (FastAPI + Python 3.9)
- **Framework:** FastAPI 0.115.0 con Uvicorn
- **Database:** PostgreSQL 16 + PostGIS 3.4
- **Caché:** Redis 7 Alpine
- **ML Stack:** scikit-learn 1.5.2, pandas 2.2.2, numpy 1.26.4
- **ORM:** SQLAlchemy 2.0.35 async con asyncpg
- **Validación:** Pydantic 2.9.2
- **Logging:** structlog 24.4.0

**Features:**
- ✓ Redis caching con decorador `@cache_result()`
- ✓ Connection pooling optimizado (60 conexiones concurrentes)
- ✓ HTTP/2 client pool con keepalive
- ✓ Database indexes GIN para JSONB
- ✓ Migraciones automáticas con Alembic
- ✓ Health checks para monitoreo

### Frontend (Angular 17 + Tailwind CSS)
- **Framework:** Angular 17 con TypeScript 5.2.2
- **Styling:** Tailwind CSS 3.4.1 con design system custom
- **Mapas:** Leaflet 1.9.4
- **Gráficos:** Chart.js 4.4.0
- **HTTP Client:** Angular HttpClient

**Features:**
- ✓ Design system con tema agrícola (verde, azul, amarillo)
- ✓ Dark mode ready
- ✓ Responsive design
- ✓ Animaciones suaves
- ✓ Componentes reutilizables

### Testing (Playwright 1.48.0)
- **Framework:** Playwright 1.48.0
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Reportes:** HTML interactivo, JSON, JUnit, Markdown, Text

**Features:**
- ✓ Tests E2E completos dockerizados
- ✓ Screenshots y videos en failures
- ✓ Ejecución paralela multi-browser
- ✓ Reportes automáticos con métricas
- ✓ CI/CD ready

### Database Performance
- **PostgreSQL 16 tuning:**
  - shared_buffers: 256MB
  - effective_cache_size: 1GB
  - JIT compilation: ON
  - Random page cost: 1.1
  - Effective IO concurrency: 200

- **Índices optimizados:**
  - GIN indexes para búsquedas JSONB
  - Compound indexes para queries frecuentes
  - Indexes en foreign keys

### Caché Strategy (Redis)
- **Max memory:** 256MB
- **Eviction policy:** allkeys-lru
- **Persistence:** AOF (appendonly)
- **TTL default:** 3600s (configurable)

---

## 📊 Cobertura de Tests E2E

Los tests automáticos validan:

✓ **Dashboard:**
- Carga y visualización de historial de recomendaciones
- Búsqueda y filtrado de datos
- Interacción con mapa Leaflet
- Responsive design (desktop + mobile)

✓ **Recomendaciones:**
- Formulario de entrada de datos
- Validación de campos
- Envío y procesamiento
- Visualización de resultados con badges de confianza

✓ **API:**
- Health check endpoint
- Headers CORS correctos
- Tiempo de respuesta < 5s

✓ **Performance:**
- Tiempo de carga de página < 5s
- Imágenes con alt text
- Navegación funcional

✓ **Accesibilidad:**
- Labels en inputs
- Tab navigation
- Manejo de estados vacíos

---

## 🔥 Tecnologías de Última Línea

Este proyecto usa las versiones más recientes y estables de:

- ✅ **PostgreSQL 16** - Latest stable con JIT compilation
- ✅ **Redis 7** - Latest con AOF persistence
- ✅ **FastAPI 0.115** - Async framework más rápido de Python
- ✅ **Angular 17** - Latest con standalone components
- ✅ **Tailwind CSS 3.4** - Utility-first CSS framework
- ✅ **Playwright 1.48** - E2E testing cross-browser más moderno
- ✅ **Pydantic 2.9** - Validation con performance mejorado
- ✅ **SQLAlchemy 2.0** - ORM async de última generación
- ✅ **scikit-learn 1.5** - ML library más actualizada

---

## 📈 Performance Metrics Esperados

Con las optimizaciones implementadas:

- **Backend Response Time:** < 100ms (con caché)
- **Cache Hit Ratio:** 60-80% (para queries repetidos)
- **Database Query Time:** < 50ms (con indexes)
- **Frontend Load Time:** < 3s (first contentful paint)
- **Concurrent Users:** 60+ (con connection pool)

---

## 🐛 Troubleshooting

### Error: "ModuleNotFoundError: No module named 'redis'"
**Solución:** Rebuild del backend sin caché
```bash
docker compose build --no-cache backend
docker compose up -d
```

### Error: Frontend no responde
**Verificar:**
```bash
docker compose logs frontend
docker compose exec frontend curl -f http://localhost:4200
```

### Error: Tests fallan
**Re-ejecutar con logs detallados:**
```bash
docker compose --profile test up e2e-tests
docker compose logs e2e-tests
```

### Reset completo del proyecto:
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## 📦 Estructura del Proyecto

```
agro-ml-clone/
├── backend/
│   ├── api/
│   │   ├── app/
│   │   │   ├── cache/          # Redis client y decoradores
│   │   │   ├── clients/        # HTTP client pool
│   │   │   ├── core/           # Config y settings
│   │   │   ├── db/             # Database session y base
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   ├── schemas/        # Pydantic schemas
│   │   │   ├── services/       # Business logic
│   │   │   └── main.py         # FastAPI app
│   │   └── requirements.txt
│   ├── alembic/                # Database migrations
│   ├── machine-learning/       # ML models y training
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                # Angular components
│   │   └── styles.scss         # Tailwind + custom styles
│   ├── e2e/
│   │   ├── tests/              # Playwright tests
│   │   └── utils/              # Report generators
│   ├── playwright.config.ts    # Playwright config
│   ├── tailwind.config.js      # Tailwind config
│   ├── Dockerfile              # Production build
│   ├── Dockerfile.e2e          # E2E tests build
│   └── docker-entrypoint-e2e.sh
├── compose.yaml                # Docker Compose config
└── README.md
```

---

## 🚀 CI/CD Ready

El proyecto está listo para integrarse con:

- **GitHub Actions:** Usar `junit-results.xml`
- **GitLab CI:** Usar `junit-results.xml`
- **Jenkins:** Usar `junit-results.xml`
- **Docker Registry:** Imágenes taggeadas y versionadas

Ejemplo de GitHub Actions workflow:
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker compose up -d
      - run: docker compose --profile test up e2e-tests
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: frontend/playwright-report/
```

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 👥 Desarrollado por

**Claude AI** - Modernización completa del stack tecnológico (2025)

**Features implementadas:**
- ✅ Backend optimizado con Redis caching
- ✅ Frontend modernizado con Tailwind CSS
- ✅ Testing E2E automatizado con Playwright
- ✅ Docker Compose 100% funcional
- ✅ Documentación completa
- ✅ Performance tuning de PostgreSQL
- ✅ Database indexes optimizados
- ✅ Design system custom

---

**¿Necesitas ayuda?** Revisa los logs con `docker compose logs -f`
