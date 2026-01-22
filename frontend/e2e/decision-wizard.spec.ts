import { test, expect } from '@playwright/test';

test.describe('Decision Wizard', () => {
  test('completes full wizard flow for claim with UNKNOWN fact', async ({ page }) => {
    // Navigate to wizard for CLM-CH-001 (has UNKNOWN accessory_declared)
    await page.goto('/claims/CLM-CH-001/decide');

    // STEP 1: Setup
    await expect(page.locator('h1')).toContainText('Decision Wizard');
    await expect(page.locator('text=Governance Context')).toBeVisible();

    // Verify governance cards
    await expect(page.locator('text=Interpretation Set')).toBeVisible();
    await expect(page.locator('text=Assumption Set')).toBeVisible();

    // Verify assumption required warning
    await expect(page.locator('text=/\\d+ Assumption.*Required/')).toBeVisible();

    // Click Continue
    await page.click('button:has-text("Continue")');

    // STEP 2: Resolve Assumptions
    await expect(page.getByRole('heading', { name: 'Resolve Unknown Facts' })).toBeVisible();

    // Verify assumption is shown (label is "Accessory Declaration Status")
    await expect(page.getByText('Accessory Declaration Status')).toBeVisible();

    // Recommended option should be pre-selected (badge)
    await expect(page.getByText('Recommended', { exact: true })).toBeVisible();

    // Click Generate Decision
    await page.click('button:has-text("Generate Decision")');

    // STEP 3: Complete
    await expect(page.getByRole('heading', { name: 'Decision Generated' })).toBeVisible();

    // Verify Run ID is shown
    await expect(page.getByText('Run ID:')).toBeVisible();

    // Verify Status and Payout sections are shown
    await expect(page.getByText('Status').first()).toBeVisible();
    await expect(page.getByText('Payout').first()).toBeVisible();

    // Click View Receipt
    await page.click('button:has-text("View Receipt")');

    // Should navigate to receipt page
    await expect(page).toHaveURL(/\/decision-runs\/RUN-/);
  });

  test('wizard flow for claim with no UNKNOWN facts', async ({ page }) => {
    // CLM-CH-002 has all KNOWN facts
    await page.goto('/claims/CLM-CH-002/decide');

    // STEP 1: Setup
    await expect(page.locator('text=No Assumptions Required')).toBeVisible();

    // Click Continue
    await page.click('button:has-text("Continue")');

    // STEP 2: Resolve Assumptions
    await expect(page.locator('text=No Assumptions Needed')).toBeVisible();

    // Click Generate Decision
    await page.click('button:has-text("Generate Decision")');

    // STEP 3: Complete
    await expect(page.locator('text=Decision Generated')).toBeVisible();
  });

  test('back navigation returns to previous step', async ({ page }) => {
    await page.goto('/claims/CLM-CH-001/decide');

    // Advance to step 2
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Resolve Unknown Facts')).toBeVisible();

    // Click Back
    await page.click('button:has-text("Back")');

    // Should return to step 1
    await expect(page.locator('text=Governance Context')).toBeVisible();
  });

  test('stepper allows clicking completed steps', async ({ page }) => {
    await page.goto('/claims/CLM-CH-001/decide');

    // Advance to step 2
    await page.click('button:has-text("Continue")');
    await expect(page.getByRole('heading', { name: 'Resolve Unknown Facts' })).toBeVisible();

    // Click step 1 in stepper - it's a button in the li containing "Setup" text
    // The completed step button shows a checkmark, so we find it by its list item
    await page.locator('li:has-text("Setup") button').click();

    // Should return to step 1
    await expect(page.getByRole('heading', { name: 'Governance Context' })).toBeVisible();
  });

  test('Back to Claim navigates back from step 1', async ({ page }) => {
    await page.goto('/claims/CLM-CH-001/decide');

    // Click "Back to Claim" on step 1
    await page.click('button:has-text("Back to Claim")');

    // Should return to claim detail
    await expect(page).toHaveURL('/claims/CLM-CH-001');
  });
});
