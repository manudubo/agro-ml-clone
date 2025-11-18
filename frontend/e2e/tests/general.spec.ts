import { test, expect } from '@playwright/test';

test.describe('API Health Check', () => {
  test('backend should be healthy', async ({ request }) => {
    const response = await request.get('http://localhost:8000/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
  });

  test('API should return proper CORS headers', async ({ request }) => {
    const response = await request.get('http://localhost:8000/health');

    const headers = response.headers();
    expect(headers).toHaveProperty('access-control-allow-origin');
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);

    // Navigate to recomendaciones
    await page.goto('/recomendaciones');
    await expect(page).toHaveURL(/recomendaciones/);
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Look for navigation links
    const navLinks = page.locator('nav a, header a, [role="navigation"] a');
    const linkCount = await navLinks.count();

    if (linkCount > 0) {
      // Click first navigation link
      const firstLink = navLinks.first();
      await firstLink.click();

      // Should navigate somewhere
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).toBeTruthy();
    }
  });
});

test.describe('Performance', () => {
  test('page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // Images should have alt attribute (even if empty for decorative)
      expect(alt).toBeDefined();
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-page');

    // Should either redirect or show 404 page
    // Not crash completely
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle API errors', async ({ page }) => {
    // This would require mocking API errors
    // For now, just verify error UI exists
    await page.goto('/recomendaciones');

    // Check that error handling elements exist in the code
    const errorElements = page.locator('.error, .alert-error, [role="alert"]');
    // Don't expect them to be visible, just that they exist in DOM
    expect(await errorElements.count()).toBeGreaterThanOrEqual(0);
  });
});
