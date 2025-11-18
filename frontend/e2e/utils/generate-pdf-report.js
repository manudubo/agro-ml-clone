/**
 * Generate PDF report from Playwright test results
 *
 * Run after tests with: npm run test:e2e:pdf
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Read test results
const resultsPath = path.join(__dirname, '../../playwright-report/results.json');

if (!fs.existsSync(resultsPath)) {
  console.error('❌ No test results found. Run tests first with: npm run test:e2e');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Create PDF document
const doc = new PDFDocument({
  size: 'A4',
  margin: 50
});

// Output path
const outputPath = path.join(__dirname, '../../playwright-report/test-report.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Helper functions
function addTitle(text, size = 24) {
  doc
    .fontSize(size)
    .font('Helvetica-Bold')
    .fillColor('#10b981')
    .text(text, { align: 'center' })
    .moveDown(0.5);
}

function addSubtitle(text, size = 18) {
  doc
    .fontSize(size)
    .font('Helvetica-Bold')
    .fillColor('#1f2937')
    .text(text)
    .moveDown(0.3);
}

function addText(text, color = '#374151') {
  doc
    .fontSize(12)
    .font('Helvetica')
    .fillColor(color)
    .text(text)
    .moveDown(0.2);
}

function addSeparator() {
  doc
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .strokeColor('#e5e7eb')
    .stroke()
    .moveDown(0.5);
}

// Title Page
addTitle('Agro ML E2E Test Report', 28);

doc
  .fontSize(14)
  .font('Helvetica')
  .fillColor('#6b7280')
  .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
  .moveDown(2);

// Summary Statistics
addSubtitle('📊 Test Summary');

const suites = results.suites || [];
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let skippedTests = 0;

function countTests(suite) {
  if (suite.specs) {
    suite.specs.forEach(spec => {
      totalTests++;
      const testResults = spec.tests || [];
      const passed = testResults.some(t => t.results?.some(r => r.status === 'passed'));
      const failed = testResults.some(t => t.results?.some(r => r.status === 'failed'));
      const skipped = testResults.some(t => t.results?.some(r => r.status === 'skipped'));

      if (passed) passedTests++;
      else if (failed) failedTests++;
      else if (skipped) skippedTests++;
    });
  }

  if (suite.suites) {
    suite.suites.forEach(countTests);
  }
}

suites.forEach(countTests);

const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

// Summary Box
doc.rect(50, doc.y, 495, 120)
  .fillColor('#f9fafb')
  .fill()
  .stroke();

const boxY = doc.y + 20;

doc
  .fontSize(16)
  .font('Helvetica-Bold')
  .fillColor('#10b981')
  .text(`✅ Passed: ${passedTests}`, 70, boxY);

doc
  .fillColor('#ef4444')
  .text(`❌ Failed: ${failedTests}`, 270, boxY);

doc
  .fillColor('#6b7280')
  .text(`⊝ Skipped: ${skippedTests}`, 70, boxY + 30);

doc
  .fillColor('#1f2937')
  .text(`📝 Total: ${totalTests}`, 270, boxY + 30);

doc
  .fontSize(20)
  .fillColor(passRate >= 80 ? '#10b981' : passRate >= 50 ? '#f59e0b' : '#ef4444')
  .text(`Pass Rate: ${passRate}%`, 70, boxY + 65);

doc.moveDown(8);

addSeparator();

// Detailed Results
addSubtitle('📋 Detailed Results');

function addSuiteResults(suite, level = 0) {
  const indent = 50 + (level * 20);

  if (suite.title) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1f2937')
      .text(`${'\t'.repeat(level)}${suite.title}`, indent, doc.y);
    doc.moveDown(0.3);
  }

  if (suite.specs) {
    suite.specs.forEach(spec => {
      const testResults = spec.tests || [];
      testResults.forEach(test => {
        const result = test.results?.[0];
        const status = result?.status || 'unknown';

        let statusIcon = '';
        let statusColor = '#6b7280';

        if (status === 'passed') {
          statusIcon = '✅';
          statusColor = '#10b981';
        } else if (status === 'failed') {
          statusIcon = '❌';
          statusColor = '#ef4444';
        } else if (status === 'skipped') {
          statusIcon = '⊝';
          statusColor = '#9ca3af';
        }

        const duration = result?.duration ? `(${(result.duration / 1000).toFixed(2)}s)` : '';

        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor(statusColor)
          .text(`${statusIcon} ${test.title} ${duration}`, indent + 20, doc.y);

        doc.moveDown(0.2);

        // Add error details if failed
        if (status === 'failed' && result.error) {
          doc
            .fontSize(9)
            .fillColor('#ef4444')
            .text(`   Error: ${result.error.message || 'Unknown error'}`, indent + 40, doc.y);
          doc.moveDown(0.3);
        }
      });
    });
  }

  if (suite.suites) {
    suite.suites.forEach(s => addSuiteResults(s, level + 1));
  }
}

suites.forEach(suite => addSuiteResults(suite));

// Add new page for recommendations
doc.addPage();

addTitle('📌 Recommendations', 20);
addSeparator();

if (failedTests > 0) {
  addText('⚠️ Some tests have failed. Please review the errors above and:', '#ef4444');
  addText('  • Check application logs for errors');
  addText('  • Verify backend services are running');
  addText('  • Ensure database is properly seeded');
  addText('  • Review recent code changes');
  doc.moveDown(0.5);
}

if (passRate < 80) {
  addText('⚠️ Test coverage is below 80%. Consider:', '#f59e0b');
  addText('  • Adding more test cases');
  addText('  • Improving existing tests');
  addText('  • Testing edge cases');
  doc.moveDown(0.5);
}

if (passRate >= 95) {
  addText('✅ Excellent test coverage! Keep up the good work.', '#10b981');
  doc.moveDown(0.5);
}

// Footer
doc
  .fontSize(10)
  .fillColor('#9ca3af')
  .text(
    `Report generated by Playwright E2E Testing Framework`,
    50,
    750,
    { align: 'center' }
  );

// Finalize PDF
doc.end();

console.log(`\n✅ PDF report generated successfully!`);
console.log(`📄 Location: ${outputPath}`);
console.log(`\n📊 Summary:`);
console.log(`   Total Tests: ${totalTests}`);
console.log(`   Passed: ${passedTests} ✅`);
console.log(`   Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
console.log(`   Skipped: ${skippedTests}`);
console.log(`   Pass Rate: ${passRate}%\n`);
