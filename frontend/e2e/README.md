# 🎭 Playwright E2E Testing

End-to-end testing suite for Agro ML Frontend using Playwright.

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Running backend (http://localhost:8000)
- Running frontend (http://localhost:4200)

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
npx playwright install  # Install browsers
```

### Run Tests

```bash
# Run all tests (headless)
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test dashboard.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### View Reports

```bash
# HTML report
npm run test:e2e:report

# Generate PDF report
npm run test:e2e:pdf
```

## 📁 Test Structure

```
e2e/
├── tests/
│   ├── dashboard.spec.ts       # Dashboard functionality
│   ├── recommendations.spec.ts # Recommendations form
│   └── general.spec.ts         # General app tests
├── utils/
│   └── generate-pdf-report.js  # PDF report generator
└── README.md
```

## 🧪 Test Coverage

### Dashboard Tests
- ✅ Page load
- ✅ History table display
- ✅ Search/filter functionality
- ✅ Map interaction
- ✅ Responsive design
- ✅ Empty state handling

### Recommendations Tests
- ✅ Form display
- ✅ Field validation
- ✅ Form submission
- ✅ Loading states
- ✅ Results display
- ✅ Confidence badges
- ✅ Accessibility

### General Tests
- ✅ API health check
- ✅ Navigation
- ✅ Performance
- ✅ Error handling
- ✅ CORS headers

## 📊 Test Reports

### HTML Report
Interactive HTML report with traces, screenshots, and videos.

```bash
npm run test:e2e
npm run test:e2e:report
```

### PDF Report
Auto-generated PDF with summary and detailed results.

```bash
npm run test:e2e:pdf
```

Location: `playwright-report/test-report.pdf`

## 🎯 Writing Tests

### Basic Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/path');

    const element = page.locator('selector');
    await expect(element).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid** for stable selectors
2. **Wait for network idle** before assertions
3. **Take screenshots** on failure (automatic)
4. **Group related tests** in describe blocks
5. **Clean up** after tests

## 🔧 Configuration

Edit `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './e2e/tests',
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // ...
});
```

## 🐛 Debugging

### Run in Debug Mode

```bash
npx playwright test --debug
```

### View Trace

```bash
npx playwright show-trace playwright-report/trace.zip
```

### Screenshots & Videos

Failed tests automatically capture:
- Screenshot (PNG)
- Video (WebM)
- Trace file

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 🌐 Multi-Browser Testing

Tests run on:
- ✅ Chromium
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome
- ✅ Mobile Safari

## 🔐 Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:4200
API_URL=http://localhost:8000
HEADLESS=true
```

## 📝 Common Commands

```bash
# Run specific browser
npx playwright test --project=firefox

# Run in headed mode
npx playwright test --headed

# Run single test file
npx playwright test dashboard.spec.ts

# Update snapshots
npx playwright test --update-snapshots

# Generate code
npx playwright codegen http://localhost:4200
```

## 🤝 Contributing

1. Write tests for new features
2. Ensure tests pass locally
3. Add meaningful test descriptions
4. Follow existing test patterns
5. Update this README if needed

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)

## ⚠️ Troubleshooting

### Tests timeout
- Increase timeout in config
- Check if backend is running
- Verify network connectivity

### Selectors not found
- Use `page.pause()` to debug
- Check element visibility
- Use more specific selectors

### Flaky tests
- Add proper waits
- Use `waitForLoadState`
- Avoid hard-coded timeouts

## 📞 Support

Issues? Check:
1. Backend is running (port 8000)
2. Frontend is running (port 4200)
3. Database has test data
4. Browsers are installed

---

**Last Updated:** 2025-11-18
**Playwright Version:** 1.48.0
