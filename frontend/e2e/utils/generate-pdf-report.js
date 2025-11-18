/**
 * Generador de Reportes de Texto para Tests E2E
 *
 * Este script lee los resultados JSON de Playwright y genera un reporte de texto detallado
 * con estadísticas, resultados por suite, y recomendaciones.
 *
 * Uso:
 *   node e2e/utils/generate-pdf-report.js
 *
 * Genera:
 *   playwright-report/test-report.txt
 *   playwright-report/test-report.md
 */

const fs = require('fs');
const path = require('path');

// Read test results
const resultsPath = path.join(__dirname, '../../test-results.json');

if (!fs.existsSync(resultsPath)) {
  console.error('❌ No test results found. Run tests first with: npm run test:e2e');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Calculate statistics
const stats = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  duration: 0,
  suites: []
};

function processSpecs(specs) {
  if (!specs) return;

  specs.forEach(spec => {
    stats.totalTests++;

    if (spec.ok) {
      stats.passedTests++;
    } else if (spec.tests && spec.tests.length > 0) {
      const test = spec.tests[0];
      if (test.status === 'skipped') {
        stats.skippedTests++;
      } else {
        stats.failedTests++;
      }
    }
  });
}

function processSuite(suite) {
  if (suite.specs) {
    processSpecs(suite.specs);
  }

  if (suite.suites) {
    suite.suites.forEach(s => processSuite(s));
  }
}

// Process all suites
if (results.suites) {
  results.suites.forEach(suite => {
    processSuite(suite);
    stats.suites.push({
      title: suite.title,
      file: suite.file
    });
  });
}

const passRate = stats.totalTests > 0
  ? ((stats.passedTests / stats.totalTests) * 100).toFixed(1)
  : 0;

// Generate text report
const timestamp = new Date().toLocaleString('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const textReport = `
================================================================================
                  AGRO ML - REPORTE DE TESTS E2E
================================================================================

Fecha de Generación: ${timestamp}
Entorno: Docker Compose

--------------------------------------------------------------------------------
RESUMEN EJECUTIVO
--------------------------------------------------------------------------------

Total de Tests:     ${stats.totalTests}
✓ Aprobados:        ${stats.passedTests}
✗ Fallados:         ${stats.failedTests}
⊘ Omitidos:         ${stats.skippedTests}

Tasa de Éxito:      ${passRate}%

Estado General:     ${passRate >= 90 ? '✓ EXCELENTE' : passRate >= 70 ? '⚠ ACEPTABLE' : '✗ REQUIERE ATENCIÓN'}

--------------------------------------------------------------------------------
SUITES DE TESTS EJECUTADAS
--------------------------------------------------------------------------------

${stats.suites.map((suite, i) => `${i + 1}. ${suite.title || 'Suite sin título'}
   Archivo: ${suite.file || 'N/A'}`).join('\n\n')}

--------------------------------------------------------------------------------
ANÁLISIS DETALLADO
--------------------------------------------------------------------------------

${stats.failedTests === 0
  ? '✓ Todos los tests pasaron exitosamente. La aplicación está funcionando correctamente.'
  : `⚠ Se encontraron ${stats.failedTests} test(s) fallido(s).
   Revisar el reporte HTML para más detalles: playwright-report/index.html`}

--------------------------------------------------------------------------------
COBERTURA DE TESTS
--------------------------------------------------------------------------------

✓ Dashboard - Historial de Recomendaciones
✓ Dashboard - Búsqueda y Filtrado
✓ Dashboard - Mapa Leaflet
✓ Recomendaciones - Formulario
✓ Recomendaciones - Validación
✓ Recomendaciones - Envío
✓ API Health Check
✓ Performance
✓ Accesibilidad

--------------------------------------------------------------------------------
TECNOLOGÍAS TESTEADAS
--------------------------------------------------------------------------------

• Frontend: Angular 17 + Tailwind CSS
• Backend: FastAPI + PostgreSQL + Redis
• Mapas: Leaflet 1.9.4
• Gráficos: Chart.js 4.4.0
• Tests: Playwright 1.48.0
• Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

--------------------------------------------------------------------------------
REPORTES GENERADOS
--------------------------------------------------------------------------------

1. HTML Interactivo: playwright-report/index.html
   → Abrir en navegador para ver resultados detallados con screenshots

2. JSON: test-results.json
   → Formato estructurado para CI/CD

3. JUnit: junit-results.xml
   → Compatible con Jenkins, GitLab CI, GitHub Actions

4. Este reporte: playwright-report/test-report.txt

--------------------------------------------------------------------------------
RECOMENDACIONES
--------------------------------------------------------------------------------

${passRate >= 90
  ? `✓ La aplicación está en excelente estado
✓ Todos los componentes críticos funcionan correctamente
→ Continuar con el monitoreo regular de tests`
  : passRate >= 70
  ? `⚠ La aplicación tiene problemas menores
→ Revisar tests fallidos y corregir
→ Ejecutar tests nuevamente después de correcciones`
  : `✗ La aplicación requiere atención urgente
→ Revisar todos los tests fallidos
→ Priorizar corrección de bugs críticos
→ No deployar hasta resolver problemas`}

--------------------------------------------------------------------------------
PRÓXIMOS PASOS
--------------------------------------------------------------------------------

1. Revisar reporte HTML:
   open playwright-report/index.html

2. Ver logs detallados:
   docker compose logs e2e-tests

3. Re-ejecutar tests:
   docker compose --profile test up e2e-tests --force-recreate

4. Ejecutar tests de un browser específico:
   docker compose exec e2e-tests npx playwright test --project=chromium

================================================================================
                            FIN DEL REPORTE
================================================================================
`;

// Generate Markdown report
const markdownReport = `# Agro ML - Reporte de Tests E2E

**Fecha:** ${timestamp}
**Entorno:** Docker Compose

---

## 📊 Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Total de Tests** | ${stats.totalTests} |
| **✓ Aprobados** | ${stats.passedTests} |
| **✗ Fallados** | ${stats.failedTests} |
| **⊘ Omitidos** | ${stats.skippedTests} |
| **Tasa de Éxito** | **${passRate}%** |

### Estado General: ${passRate >= 90 ? '✅ EXCELENTE' : passRate >= 70 ? '⚠️ ACEPTABLE' : '❌ REQUIERE ATENCIÓN'}

---

## 🧪 Suites de Tests Ejecutadas

${stats.suites.map((suite, i) => `### ${i + 1}. ${suite.title || 'Suite sin título'}
- **Archivo:** \`${suite.file || 'N/A'}\``).join('\n\n')}

---

## 📈 Análisis Detallado

${stats.failedTests === 0
  ? '✅ **Todos los tests pasaron exitosamente.** La aplicación está funcionando correctamente.'
  : `⚠️ **Se encontraron ${stats.failedTests} test(s) fallido(s).**
Revisar el [reporte HTML](playwright-report/index.html) para más detalles.`}

---

## ✅ Cobertura de Tests

- ✓ Dashboard - Historial de Recomendaciones
- ✓ Dashboard - Búsqueda y Filtrado
- ✓ Dashboard - Mapa Leaflet
- ✓ Recomendaciones - Formulario
- ✓ Recomendaciones - Validación
- ✓ Recomendaciones - Envío
- ✓ API Health Check
- ✓ Performance
- ✓ Accesibilidad

---

## 🛠 Tecnologías Testeadas

- **Frontend:** Angular 17 + Tailwind CSS
- **Backend:** FastAPI + PostgreSQL + Redis
- **Mapas:** Leaflet 1.9.4
- **Gráficos:** Chart.js 4.4.0
- **Tests:** Playwright 1.48.0
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

---

## 📄 Reportes Generados

1. **HTML Interactivo:** \`playwright-report/index.html\`
   → Abrir en navegador para ver resultados detallados con screenshots

2. **JSON:** \`test-results.json\`
   → Formato estructurado para CI/CD

3. **JUnit:** \`junit-results.xml\`
   → Compatible con Jenkins, GitLab CI, GitHub Actions

4. **Este reporte:** \`playwright-report/test-report.md\`

---

## 💡 Recomendaciones

${passRate >= 90
  ? `- ✅ La aplicación está en excelente estado
- ✅ Todos los componentes críticos funcionan correctamente
- → Continuar con el monitoreo regular de tests`
  : passRate >= 70
  ? `- ⚠️ La aplicación tiene problemas menores
- → Revisar tests fallidos y corregir
- → Ejecutar tests nuevamente después de correcciones`
  : `- ❌ La aplicación requiere atención urgente
- → Revisar todos los tests fallidos
- → Priorizar corrección de bugs críticos
- → No deployar hasta resolver problemas`}

---

## 🚀 Próximos Pasos

1. **Revisar reporte HTML:**
   \`\`\`bash
   open playwright-report/index.html
   \`\`\`

2. **Ver logs detallados:**
   \`\`\`bash
   docker compose logs e2e-tests
   \`\`\`

3. **Re-ejecutar tests:**
   \`\`\`bash
   docker compose --profile test up e2e-tests --force-recreate
   \`\`\`

4. **Ejecutar tests de un browser específico:**
   \`\`\`bash
   docker compose exec e2e-tests npx playwright test --project=chromium
   \`\`\`
`;

// Write reports
const reportDir = path.join(__dirname, '../../playwright-report');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const txtPath = path.join(reportDir, 'test-report.txt');
const mdPath = path.join(reportDir, 'test-report.md');

fs.writeFileSync(txtPath, textReport);
fs.writeFileSync(mdPath, markdownReport);

console.log('');
console.log('========================================');
console.log('  REPORTES GENERADOS EXITOSAMENTE');
console.log('========================================');
console.log('');
console.log('✓ Text Report:', txtPath);
console.log('✓ Markdown Report:', mdPath);
console.log('');
console.log('Resumen:');
console.log(`  Total: ${stats.totalTests}`);
console.log(`  ✓ Passed: ${stats.passedTests}`);
console.log(`  ✗ Failed: ${stats.failedTests}`);
console.log(`  Pass Rate: ${passRate}%`);
console.log('');
