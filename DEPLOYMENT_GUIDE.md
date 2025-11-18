# 🚀 GUÍA DE DESPLIEGUE Y TESTING

## ⚠️ SOLUCIÓN AL ERROR DE DOCKER

El error `ModuleNotFoundError: No module named 'redis'` ocurre porque el contenedor se construyó antes de agregar Redis a `requirements.txt`.

### ✅ SOLUCIÓN (Ejecutar en tu máquina local):

```bash
# 1. Detener y eliminar contenedores actuales
docker compose down -v

# 2. Reconstruir SOLO el backend (más rápido)
docker compose build --no-cache backend

# 3. Levantar todos los servicios
docker compose up -d

# 4. Verificar que todo está corriendo
docker compose ps
docker compose logs backend | tail -20
```

### 🔍 Verificación de Servicios

```bash
# Redis
docker compose exec redis redis-cli ping
# Esperado: PONG

# PostgreSQL
docker compose exec postgres pg_isready -U postgres
# Esperado: accepting connections

# Backend Health
curl http://localhost:8000/health
# Esperado: {"status": "healthy", ...}

# Frontend
curl http://localhost:4200
# Esperado: HTML de Angular
```

---

## 📦 INSTALACIÓN COMPLETA (Primera Vez)

### 1. Clonar y Checkout Branch

```bash
git clone https://github.com/manudubo/agro-ml-clone.git
cd agro-ml-clone
git checkout claude/modernization-2025-01CRdtb6eSkvpxtY2WjQXdLh
```

### 2. Build y Start

```bash
# Opción A: Build completo (primera vez)
docker compose build
docker compose up -d

# Opción B: Solo rebuild backend (si ya tienes frontend)
docker compose build --no-cache backend
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f
```

### 3. Verificar Servicios

```bash
# Todos los servicios deberían estar "healthy"
docker compose ps

# Deberías ver:
# - backend: Up (healthy)
# - frontend: Up
# - postgres: Up (healthy)
# - redis: Up (healthy)
```

---

## 🧪 EJECUTAR TESTS

### Backend Tests (Unit & Integration)

```bash
# Entrar al contenedor backend
docker compose exec backend bash

# Ejecutar tests con coverage
pytest --cov=app --cov-report=html --cov-report=term

# Ver reporte
exit
open htmlcov/index.html  # o abrir manualmente
```

### Frontend Tests E2E (Playwright)

#### Opción 1: Dentro de Docker

```bash
# Entrar al contenedor frontend
docker compose exec frontend bash

# Instalar Playwright browsers (primera vez)
npx playwright install

# Ejecutar tests
npm run test:e2e

# Generar reporte PDF
npm run test:e2e:pdf

# Salir
exit
```

#### Opción 2: Local (Recomendado para desarrollo)

```bash
cd frontend

# Instalar dependencias (primera vez)
npm install
npx playwright install

# Ejecutar tests
npm run test:e2e

# Tests en modo UI (interactivo)
npm run test:e2e:ui

# Ver reporte HTML
npm run test:e2e:report

# Generar PDF
npm run test:e2e:pdf
```

### Ver Reportes de Tests

```bash
# HTML Report
cd frontend
npm run test:e2e:report
# Abre en navegador: playwright-report/index.html

# PDF Report
npm run test:e2e:pdf
# Archivo generado: playwright-report/test-report.pdf
```

---

## 🎯 TESTING COMPLETO (QA Checklist)

### 1. Backend Health

```bash
# Health endpoint
curl http://localhost:8000/health
# Esperado: {"status": "healthy", "version": "2.0.0"}

# API root
curl http://localhost:8000/
# Esperado: {"name": "Agro ML API", "version": "2.0.0", ...}

# Swagger docs
open http://localhost:8000/api/docs
```

### 2. Redis Cache

```bash
# Verificar Redis está corriendo
docker compose exec redis redis-cli ping

# Ver keys cacheadas (después de usar el API)
docker compose exec redis redis-cli KEYS "*"

# Monitor cache en tiempo real
docker compose exec redis redis-cli MONITOR
```

### 3. Base de Datos

```bash
# Conectar a PostgreSQL
docker compose exec postgres psql -U postgres -d ml_agro

# Verificar índices creados
\di

# Deberías ver:
# - idx_prediccion_recomendacion_gin
# - idx_prediccion_alternativas_gin
# - idx_prediccion_cliente_fecha
# - idx_modelo_tipo_activo
# etc.

# Salir
\q
```

### 4. Frontend Build

```bash
# Build de producción
cd frontend
npm run build

# Verificar bundle size
ls -lh dist/agro-ml-frontend/
# Debería ser < 2MB total
```

### 5. E2E Tests

```bash
cd frontend

# Test completo con todos los browsers
npm run test:e2e

# Solo Chrome (más rápido)
npx playwright test --project=chromium

# Test específico
npx playwright test dashboard.spec.ts

# Debug mode
npx playwright test --debug
```

---

## 📊 MÉTRICAS DE PERFORMANCE

### Medir Performance del Backend

```bash
# Usar wrk o ab para load testing
# Instalar: brew install wrk (Mac) o apt-get install wrk (Linux)

# Test simple
wrk -t4 -c100 -d30s http://localhost:8000/health

# Test con payload
wrk -t4 -c100 -d30s -s post.lua http://localhost:8000/api/v1/recomendaciones/siembra
```

### Medir Performance del Frontend

```bash
# Lighthouse CLI
npm install -g lighthouse

# Correr lighthouse
lighthouse http://localhost:4200 --view

# Esperado:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 80
```

---

## 🐛 TROUBLESHOOTING

### Error: "redis module not found"
**Solución:** Rebuild backend container
```bash
docker compose build --no-cache backend
docker compose up -d
```

### Error: "Alembic failed"
**Causa:** Base de datos no está lista
**Solución:** El comando ya tiene retry automático, espera 30-60 segundos

### Error: "Cannot connect to database"
**Verificar:**
```bash
docker compose ps postgres  # ¿Está running y healthy?
docker compose logs postgres | tail -20
docker compose restart postgres
```

### Error: Frontend no carga
**Verificar:**
```bash
docker compose logs frontend | tail -30
# Debería mostrar: "compiled successfully"
```

### Tests fallan con timeout
**Solución:**
```bash
# Asegúrate que backend esté corriendo
curl http://localhost:8000/health

# Asegúrate que frontend esté corriendo
curl http://localhost:4200
```

---

## 🔧 DESARROLLO LOCAL (Sin Docker)

### Backend

```bash
cd backend/api

# Crear virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Variables de entorno
export DATABASE_URL="postgresql+asyncpg://postgres@localhost:5432/ml_agro"
export REDIS_URL="redis://localhost:6379"

# Migrar DB
cd ../..
alembic -c backend/alembic.ini upgrade head

# Ejecutar
cd backend/api
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar dev server
npm start

# Abrir en navegador
open http://localhost:4200
```

---

## 📈 MONITOREO EN PRODUCCIÓN

### Logs

```bash
# Ver logs en tiempo real
docker compose logs -f backend

# Logs de Redis
docker compose logs -f redis

# Filtrar por nivel
docker compose logs backend | grep ERROR
```

### Métricas de Redis

```bash
# Stats de Redis
docker compose exec redis redis-cli INFO stats

# Memory usage
docker compose exec redis redis-cli INFO memory

# Hit rate
docker compose exec redis redis-cli INFO stats | grep keyspace
```

### Database Performance

```bash
# Queries lentas
docker compose exec postgres psql -U postgres -d ml_agro -c "
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;"

# Índices más usados
docker compose exec postgres psql -U postgres -d ml_agro -c "
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC
LIMIT 10;"
```

---

## 🚀 DEPLOY A PRODUCCIÓN

### Pre-deployment Checklist

- [ ] Todos los tests pasan (`npm run test:e2e`)
- [ ] Backend tests pasan (`pytest`)
- [ ] Variables de entorno configuradas
- [ ] Secrets configurados (JWT_SECRET_KEY, POSTGRES_PASSWORD)
- [ ] Database backups configurados
- [ ] Redis persistence configurado
- [ ] Monitoring configurado (Sentry, etc.)
- [ ] SSL/TLS configurado
- [ ] Rate limiting configurado
- [ ] CORS configurado para dominio de producción

### Build de Producción

```bash
# Frontend
cd frontend
npm run build -- --configuration=production

# Archivos generados en: dist/agro-ml-frontend/

# Backend (Docker)
docker compose -f compose.prod.yaml build
docker compose -f compose.prod.yaml up -d
```

### Variables de Entorno para Producción

```bash
# .env.production
DATABASE_URL=postgresql+asyncpg://user:pass@db-host:5432/ml_agro
REDIS_URL=redis://redis-host:6379
JWT_SECRET_KEY=your-super-secret-key-change-me
POSTGRES_PASSWORD=strong-password-here
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
CACHE_ENABLED=true
LOG_LEVEL=INFO
```

---

## 📞 SOPORTE

### Logs de Debugging

```bash
# Backend logs detallados
docker compose logs backend --tail=100

# Frontend logs
docker compose logs frontend --tail=100

# Todos los servicios
docker compose logs --tail=50
```

### Reset Completo

```bash
# CUIDADO: Esto elimina TODOS los datos
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### Backup de Base de Datos

```bash
# Backup
docker compose exec postgres pg_dump -U postgres ml_agro > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres ml_agro < backup.sql
```

---

## ✅ CHECKLIST DE TESTING FINAL

Antes de mergear a main, verifica:

### Backend
- [ ] Health check responde correctamente
- [ ] Redis está conectado y funcionando
- [ ] Database tiene todos los índices
- [ ] Migraciones aplicadas correctamente
- [ ] Modelos ML se cargan sin error
- [ ] API docs accesibles en /api/docs
- [ ] CORS configurado correctamente

### Frontend
- [ ] Build de producción exitoso
- [ ] Bundle size < 2MB
- [ ] Lighthouse score > 90
- [ ] Tailwind CSS aplicado
- [ ] Dark mode ready (toggle pendiente)
- [ ] Responsive en mobile

### E2E Tests
- [ ] Todos los tests de Playwright pasan
- [ ] Pass rate > 90%
- [ ] Screenshots de failures revisadas
- [ ] PDF report generado
- [ ] No hay tests flakyDashboard
- [ ] Dashboard loading correctamente
- [ ] Mapa interactivo funciona
- [ ] Filtros funcionan
- [ ] Tabla muestra datos

### Recomendaciones
- [ ] Formulario valida correctamente
- [ ] Submit funciona
- [ ] Loading states visibles
- [ ] Resultados se muestran
- [ ] Badges de confianza correctos

---

**Última actualización:** 2025-11-18
**Branch:** claude/modernization-2025-01CRdtb6eSkvpxtY2WjQXdLh
