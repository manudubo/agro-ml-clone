import { test, expect } from '@playwright/test';

test.describe('Dashboard - Historial de Recomendaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Agro ML/i);

    // Verify main heading exists
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
  });

  test('should display history table', async ({ page }) => {
    // Wait for table to load
    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verify table headers exist
    const headers = ['Cultivo', 'Lote', 'Fecha', 'Confianza'];
    for (const header of headers) {
      await expect(page.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeVisible();
    }
  });

  test('should filter history by search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    // Type search term
    await searchInput.fill('soja');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify results
    const rows = page.locator('tbody tr');
    const count = await rows.count();

    // Should have some results or no results message
    if (count > 0) {
      // All visible rows should contain 'soja'
      for (let i = 0; i < Math.min(count, 5); i++) {
        const row = rows.nth(i);
        const text = await row.textContent();
        expect(text?.toLowerCase()).toContain('soja');
      }
    }
  });

  test('should interact with map', async ({ page }) => {
    // Wait for map to load
    const map = page.locator('.leaflet-container');
    await expect(map).toBeVisible({ timeout: 15000 });

    // Verify map markers exist
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();
    expect(markerCount).toBeGreaterThan(0);

    // Click first marker
    if (markerCount > 0) {
      await markers.first().click();

      // Map click should filter table
      await page.waitForTimeout(500);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still be visible
    await expect(page.locator('body')).toBeVisible();

    // Main content should be visible
    const mainContent = page.locator('main, .container, [role="main"]').first();
    await expect(mainContent).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Navigate to page
    await page.goto('/dashboard');

    // Wait for load
    await page.waitForLoadState('networkidle');

    // Check if table or empty state is visible
    const table = page.locator('table');
    const emptyState = page.getByText(/no hay recomendaciones|sin resultados/i);

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // At least one should be visible
    expect(hasTable || hasEmptyState).toBeTruthy();
  });
});
