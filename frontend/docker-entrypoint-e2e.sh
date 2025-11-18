#!/bin/bash
set -e

echo "========================================="
echo "  Agro ML - E2E Test Runner"
echo "========================================="
echo ""

# Esperar a que el frontend esté disponible
echo "[1/4] Esperando a que el frontend esté listo..."
FRONTEND_URL="${FRONTEND_URL:-http://frontend:4200}"
MAX_WAIT=180
WAIT_TIME=0

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -f -s -o /dev/null "$FRONTEND_URL"; then
        echo "✓ Frontend está listo en $FRONTEND_URL"
        break
    fi
    echo "  Esperando... ($WAIT_TIME/$MAX_WAIT segundos)"
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "✗ Error: Frontend no respondió después de $MAX_WAIT segundos"
    exit 1
fi

# Esperar tiempo adicional para que la app se estabilice
echo ""
echo "[2/4] Esperando 60 segundos adicionales para estabilización..."
sleep 60

# Ejecutar tests
echo ""
echo "[3/4] Ejecutando tests E2E con Playwright..."
echo ""
npx playwright test --reporter=html,json,junit || TEST_EXIT_CODE=$?

# Generar reporte resumido
echo ""
echo "[4/4] Generando reporte de resultados..."
echo ""

if [ -f "test-results.json" ]; then
    node -e "
    const fs = require('fs');
    const results = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));

    const suites = results.suites || [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    function countTests(suite) {
        if (suite.specs) {
            suite.specs.forEach(spec => {
                totalTests++;
                if (spec.ok) passedTests++;
                else failedTests++;
            });
        }
        if (suite.suites) {
            suite.suites.forEach(s => countTests(s));
        }
    }

    suites.forEach(suite => countTests(suite));

    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

    console.log('');
    console.log('========================================');
    console.log('  RESUMEN DE TESTS E2E');
    console.log('========================================');
    console.log('');
    console.log('Total:    ' + totalTests);
    console.log('✓ Passed: ' + passedTests + ' (' + passRate + '%)');
    console.log('✗ Failed: ' + failedTests);
    console.log('⊘ Skipped: ' + skippedTests);
    console.log('');
    console.log('Reportes generados:');
    console.log('  - HTML: playwright-report/index.html');
    console.log('  - JSON: test-results.json');
    console.log('  - JUnit: junit-results.xml');
    console.log('========================================');
    console.log('');
    "
fi

# Mantener el contenedor vivo si se requiere
if [ "${KEEP_ALIVE}" = "true" ]; then
    echo "Contenedor manteniéndose vivo para inspección..."
    echo "Presiona Ctrl+C para detener"
    tail -f /dev/null
else
    echo "Tests completados. El contenedor se detendrá."
    exit ${TEST_EXIT_CODE:-0}
fi
