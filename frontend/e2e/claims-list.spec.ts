import { test, expect } from '@playwright/test';

test.describe('Claims List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/claims');
  });

  test('displays claims table with correct columns', async ({ page }) => {
    // Verify heading
    await expect(page.locator('h1')).toContainText('Claims');

    // Verify table headers exist
    await expect(page.locator('th:has-text("Claim ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Product")')).toBeVisible();
    await expect(page.locator('th:has-text("Loss Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();

    // Verify at least one claim is shown
    await expect(page.locator('text=CLM-CH-001')).toBeVisible();
  });

  test('filters claims by search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search claim ID..."]');

    // Type search query
    await searchInput.fill('001');

    // Should show only matching claim
    await expect(page.locator('text=CLM-CH-001')).toBeVisible();

    // Other claims should be filtered out
    await expect(page.locator('text=CLM-CH-002')).not.toBeVisible();

    // Results count should update
    await expect(page.locator('text=/1 of \\d+ claims/')).toBeVisible();
  });

  test('clears filters when clicking clear button', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search claim ID..."]');

    // Apply filter
    await searchInput.fill('001');
    await expect(page.locator('text=CLM-CH-002')).not.toBeVisible();

    // Click clear filters
    await page.click('button:has-text("Clear filters")');

    // All claims should be visible again
    await expect(page.locator('text=CLM-CH-001')).toBeVisible();
    await expect(page.locator('text=CLM-CH-002')).toBeVisible();
  });

  test('navigates to claim detail when clicking claim ID', async ({ page }) => {
    await page.click('a:has-text("CLM-CH-001")');
    await expect(page).toHaveURL('/claims/CLM-CH-001');
    await expect(page.locator('h1')).toContainText('CLM-CH-001');
  });

  test('preserves filter state in URL', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search claim ID..."]');

    // Apply filter
    await searchInput.fill('003');

    // URL should contain search param
    await expect(page).toHaveURL(/\?q=003/);

    // Reload page
    await page.reload();

    // Filter should still be applied
    await expect(searchInput).toHaveValue('003');
    await expect(page.locator('text=CLM-CH-003')).toBeVisible();
  });
});
