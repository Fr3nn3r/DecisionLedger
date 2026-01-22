import { test, expect } from '@playwright/test';

test.describe('Navigation & App Shell', () => {
  test('redirects from / to /claims', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/claims');
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/claims');

    // Navigate to Decision Runs
    await page.click('text=Decision Runs');
    await expect(page).toHaveURL('/decision-runs');
    await expect(page.locator('h1')).toContainText('Decision Runs');

    // Navigate to QA Impact
    await page.click('text=QA Impact');
    await expect(page).toHaveURL('/qa-impact');
    await expect(page.locator('h1')).toContainText('QA Impact');

    // Navigate to Governance
    await page.click('text=Governance');
    await expect(page).toHaveURL('/governance');
    await expect(page.locator('h1')).toContainText('Governance');

    // Navigate to Catalogs
    await page.click('text=Catalogs');
    await expect(page).toHaveURL('/catalogs');
    await expect(page.locator('h1')).toContainText('Catalogs');

    // Navigate back to Claims
    await page.click('text=Claims');
    await expect(page).toHaveURL('/claims');
    await expect(page.locator('h1')).toContainText('Claims');
  });

  test('shows 404 page for invalid route', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    await expect(page.locator('h1')).toContainText('404');
  });
});
