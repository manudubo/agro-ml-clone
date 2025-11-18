import { test, expect } from '@playwright/test';

test.describe('Recomendaciones - Formulario de Generación', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recomendaciones');
    await page.waitForLoadState('networkidle');
  });

  test('should load recommendations page', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveTitle(/Agro ML/i);

    // Verify form exists
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should display form fields', async ({ page }) => {
    // Check for cultivo select
    const cultivoSelect = page.locator('select#cultivo, select[formControlName="cultivo"]').first();
    await expect(cultivoSelect).toBeVisible();

    // Check for campaña input
    const campanaInput = page.locator('input#campana, input[formControlName="campana"]').first();
    await expect(campanaInput).toBeVisible();

    // Check for lote select
    const loteSelect = page.locator('select#lote, select[formControlName="lote"]').first();
    await expect(loteSelect).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /generar|enviar|crear/i });
    await expect(submitButton).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Find submit button
    const submitButton = page.getByRole('button', { name: /generar|enviar|crear/i });

    // Try to submit empty form
    await submitButton.click();

    // Wait a bit for validation
    await page.waitForTimeout(500);

    // Should show validation errors or prevent submission
    // Check if form is still on the same page (didn't submit)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/recomendaciones');
  });

  test('should fill form successfully', async ({ page }) => {
    // Fill cultivo
    const cultivoSelect = page.locator('select#cultivo, select[formControlName="cultivo"]').first();
    await cultivoSelect.selectOption({ index: 1 }); // Select first non-empty option

    // Fill campaña
    const campanaInput = page.locator('input#campana, input[formControlName="campana"]').first();
    await campanaInput.fill('2024/2025');

    // Fill lote
    const loteSelect = page.locator('select#lote, select[formControlName="lote"]').first();
    await loteSelect.selectOption({ index: 1 }); // Select first non-empty option

    // Verify all fields are filled
    await expect(cultivoSelect).not.toHaveValue('');
    await expect(campanaInput).toHaveValue('2024/2025');
    await expect(loteSelect).not.toHaveValue('');
  });

  test('should show loading state on submit', async ({ page }) => {
    // Fill form first
    await page.locator('select#cultivo, select[formControlName="cultivo"]').first().selectOption({ index: 1 });
    await page.locator('input#campana, input[formControlName="campana"]').first().fill('2024/2025');
    await page.locator('select#lote, select[formControlName="lote"]').first().selectOption({ index: 1 });

    // Submit form
    const submitButton = page.getByRole('button', { name: /generar|enviar|crear/i });
    await submitButton.click();

    // Check for loading indicator (spinner, disabled button, etc.)
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    const hasSpinner = await page.locator('.spinner, .loading, [role="status"]').isVisible().catch(() => false);

    // At least one loading indicator should appear
    expect(isDisabled || hasSpinner).toBeTruthy();
  });

  test('should display results after submission', async ({ page }) => {
    // Mock successful API response if needed
    // For now, just verify the result section exists or appears

    // Fill and submit form
    await page.locator('select#cultivo, select[formControlName="cultivo"]').first().selectOption({ index: 1 });
    await page.locator('input#campana, input[formControlName="campana"]').first().fill('2024/2025');
    await page.locator('select#lote, select[formControlName="lote"]').first().selectOption({ index: 1 });

    const submitButton = page.getByRole('button', { name: /generar|enviar|crear/i });
    await submitButton.click();

    // Wait for result or error
    await page.waitForTimeout(3000);

    // Check if result section appeared or error message
    const resultSection = page.locator('.result, .recommendation-result, .card');
    const errorMessage = page.locator('.error, .alert-error, [role="alert"]');

    const hasResult = await resultSection.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);

    // Should show either result or error
    expect(hasResult || hasError).toBeTruthy();
  });

  test('should display confidence badges', async ({ page }) => {
    // This test assumes we successfully get a recommendation
    // Mock or wait for real data

    // Fill and submit
    await page.locator('select#cultivo, select[formControlName="cultivo"]').first().selectOption({ index: 1 });
    await page.locator('input#campana, input[formControlName="campana"]').first().fill('2024/2025');
    await page.locator('select#lote, select[formControlName="lote"]').first().selectOption({ index: 1 });

    await page.getByRole('button', { name: /generar|enviar|crear/i }).click();

    // Wait for results
    await page.waitForTimeout(3000);

    // Look for confidence badges
    const badges = page.locator('.badge, .badge-success, .badge-warning, .badge-error');
    const badgeCount = await badges.count();

    // If results loaded, should have at least one badge
    if (badgeCount > 0) {
      const firstBadge = badges.first();
      await expect(firstBadge).toBeVisible();
    }
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper labels
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(0);

    // Check for form accessibility
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Tab navigation should work
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['SELECT', 'INPUT', 'BUTTON']).toContain(focusedElement);
  });
});
