import { test, expect } from '@playwright/test';

test.describe('Full Demo Flow', () => {
  test('complete primary demo: claim → wizard → receipt → decision runs', async ({ page }) => {
    // 1. Start at Claims list
    await page.goto('/claims');
    await expect(page.locator('h1')).toContainText('Claims');

    // 2. Click on primary demo claim (CLM-CH-001 - tow bar scenario)
    await page.click('a:has-text("CLM-CH-001")');
    await expect(page).toHaveURL('/claims/CLM-CH-001');

    // 3. Verify UNKNOWN fact is visible (displayed as "Unknown")
    await expect(page.getByText('Accessory Declared')).toBeVisible();
    await expect(page.locator('tr:has-text("Accessory Declared")').getByText('Unknown', { exact: true })).toBeVisible();

    // 4. Click Run Decision
    await page.click('button:has-text("Run Decision"), a:has-text("Run Decision")');
    await expect(page).toHaveURL('/claims/CLM-CH-001/decide');

    // 5. Wizard Step 1: Setup
    await expect(page.getByRole('heading', { name: 'Governance Context' })).toBeVisible();
    await page.click('button:has-text("Continue")');

    // 6. Wizard Step 2: Resolve Assumptions
    await expect(page.getByRole('heading', { name: 'Resolve Unknown Facts' })).toBeVisible();
    await page.click('button:has-text("Generate Decision")');

    // 7. Wizard Step 3: Complete
    await expect(page.getByRole('heading', { name: 'Decision Generated' })).toBeVisible();

    // 8. Click View Receipt
    await page.click('button:has-text("View Receipt")');

    // 9. Verify receipt page
    await expect(page).toHaveURL(/\/decision-runs\/RUN-/);
    await expect(page.getByRole('heading', { name: 'Decision Receipt' })).toBeVisible();

    // Verify key receipt sections (Governance & Audit heading, payout table)
    await expect(page.getByText('Governance & Audit')).toBeVisible();
    await expect(page.getByText('Total Payout')).toBeVisible();

    // 10. Navigate to Decision Runs via sidebar
    await page.click('nav >> text=Decision Runs');
    await expect(page).toHaveURL('/decision-runs');
    await expect(page.locator('h1')).toContainText('Decision Runs');
  });

  test('can complete wizard for claim without UNKNOWN facts', async ({ page }) => {
    // CLM-CH-003 has all KNOWN facts
    await page.goto('/claims/CLM-CH-003/decide');

    // Quick wizard completion (no assumptions for this claim)
    await expect(page.getByText('No Assumptions Required')).toBeVisible();
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Generate Decision")');
    await page.click('button:has-text("View Receipt")');

    // Should navigate to receipt page
    await expect(page).toHaveURL(/\/decision-runs\/RUN-/);
    await expect(page.getByRole('heading', { name: 'Decision Receipt' })).toBeVisible();
  });
});

test.describe('Role Switching', () => {
  test('can change role via header dropdown', async ({ page }) => {
    await page.goto('/claims');

    // Click role selector button to open dropdown
    await page.getByRole('button', { name: /Adjuster/ }).click();

    // Click Supervisor option
    await page.getByRole('button', { name: 'Supervisor' }).click();

    // Role should now show Supervisor
    await expect(page.getByRole('button', { name: /Supervisor/ })).toBeVisible();
  });

  test('role persists across navigation', async ({ page }) => {
    await page.goto('/claims');

    // Change role to QA Lead
    await page.getByRole('button', { name: /Adjuster/ }).click();
    await page.getByRole('button', { name: 'QA Lead' }).click();

    // Navigate to another page
    await page.click('nav >> text=Decision Runs');

    // Role should still be QA Lead
    await expect(page.getByRole('button', { name: /QA Lead/ })).toBeVisible();
  });
});
