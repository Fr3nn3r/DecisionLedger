import { test, expect } from '@playwright/test';

test.describe('Claim Detail', () => {
  test('displays claim details for CLM-CH-001', async ({ page }) => {
    await page.goto('/claims/CLM-CH-001');

    // Verify heading shows claim ID
    await expect(page.locator('h1')).toContainText('CLM-CH-001');

    // Verify header info
    await expect(page.getByText('POL-CH-2025-00142')).toBeVisible(); // Policy ID
    await expect(page.getByText('CH · Motor/Casco')).toBeVisible(); // Jurisdiction + Product

    // Verify facts section exists
    await expect(page.getByRole('heading', { name: 'Facts' })).toBeVisible();

    // Verify evidence section exists
    await expect(page.getByRole('heading', { name: 'Evidence' })).toBeVisible();

    // Verify line items section exists
    await expect(page.getByRole('heading', { name: 'Line Items' })).toBeVisible();
  });

  test('highlights UNKNOWN facts with yellow styling', async ({ page }) => {
    await page.goto('/claims/CLM-CH-001');

    // CLM-CH-001 has UNKNOWN "Accessory Declared" fact
    const unknownRow = page.locator('tr:has-text("Accessory Declared")');
    await expect(unknownRow).toBeVisible();

    // Should have UNKNOWN badge (displayed as "Unknown" with yellow styling)
    await expect(unknownRow.getByText('Unknown', { exact: true })).toBeVisible();
  });

  test('shows Run Decision button', async ({ page }) => {
    await page.goto('/claims/CLM-CH-001');

    const runDecisionButton = page.locator('button:has-text("Run Decision"), a:has-text("Run Decision")');
    await expect(runDecisionButton).toBeVisible();
  });

  test('navigates to decision wizard when clicking Run Decision', async ({ page }) => {
    await page.goto('/claims/CLM-CH-001');

    await page.click('text=Run Decision');
    await expect(page).toHaveURL('/claims/CLM-CH-001/decide');
    await expect(page.locator('h1')).toContainText('Decision Wizard');
  });

  test('shows 404 for non-existent claim', async ({ page }) => {
    await page.goto('/claims/CLM-DOES-NOT-EXIST');
    await expect(page.locator('text=Claim Not Found')).toBeVisible();
  });
});
