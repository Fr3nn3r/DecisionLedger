import { test, expect } from '@playwright/test';

test.describe('Counterfactual Simulator', () => {
  /**
   * Helper to run a decision and get to the receipt page.
   * Returns the receipt page URL for navigation.
   */
  async function runDecisionAndGetReceipt(page: import('@playwright/test').Page, assumptionValue: 'NOT_DECLARED' | 'DECLARED' = 'NOT_DECLARED') {
    // Navigate to wizard for CLM-CH-001
    await page.goto('/claims/CLM-CH-001/decide');

    // STEP 1: Setup - Click Continue
    await expect(page.getByRole('heading', { name: 'Governance Context' })).toBeVisible();
    await page.click('button:has-text("Continue")');

    // STEP 2: Resolve Assumptions
    await expect(page.getByRole('heading', { name: 'Resolve Unknown Facts' })).toBeVisible();

    // Select the desired assumption value
    if (assumptionValue === 'DECLARED') {
      // Need to switch role to Supervisor first (DECLARED requires Supervisor+)
      await page.getByRole('button', { name: /Adjuster/ }).click();
      await page.getByRole('button', { name: 'Supervisor' }).click();
      // Now select DECLARED
      await page.click('label:has-text("Assume Declared")');
    }
    // NOT_DECLARED is the default/recommended, no need to click

    // Click Generate Decision
    await page.click('button:has-text("Generate Decision")');

    // STEP 3: Complete
    await expect(page.getByRole('heading', { name: 'Decision Generated' })).toBeVisible();

    // Click View Receipt
    await page.click('button:has-text("View Receipt")');

    // Verify we're on the receipt page
    await expect(page).toHaveURL(/\/decision-runs\/RUN-/);
    await expect(page.getByRole('heading', { name: 'Decision Receipt' })).toBeVisible();
  }

  test('navigates to counterfactual simulator from receipt', async ({ page }) => {
    await runDecisionAndGetReceipt(page);

    // Click "Simulate Alternative" button
    await page.click('a:has-text("Simulate Alternative")');

    // Verify we're on the counterfactual page
    await expect(page).toHaveURL(/\/decision-runs\/RUN-.*\/counterfactual/);
    await expect(page.getByRole('heading', { name: 'Counterfactual Simulator' })).toBeVisible();
  });

  test('displays base run information', async ({ page }) => {
    await runDecisionAndGetReceipt(page);
    await page.click('a:has-text("Simulate Alternative")');

    // Verify base decision section
    await expect(page.getByRole('heading', { name: 'Base Decision' })).toBeVisible();

    // Verify base run info is displayed
    await expect(page.getByText('Run ID')).toBeVisible();
    await expect(page.getByText('Timestamp')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
    await expect(page.getByText('Payout')).toBeVisible();

    // Verify run ID format
    await expect(page.locator('text=/RUN-\\d+-[a-z0-9]+/')).toBeVisible();
  });

  test('shows change type selector with assumption and interpretation options', async ({ page }) => {
    await runDecisionAndGetReceipt(page);
    await page.click('a:has-text("Simulate Alternative")');

    // Verify change selector section
    await expect(page.getByRole('heading', { name: 'Select One Change' })).toBeVisible();

    // Verify both change type options are visible
    await expect(page.getByText('Change Assumption')).toBeVisible();
    await expect(page.getByText('Change Interpretation')).toBeVisible();
  });

  test('selecting assumption change shows assumption dropdown', async ({ page }) => {
    await runDecisionAndGetReceipt(page);
    await page.click('a:has-text("Simulate Alternative")');

    // Click "Change Assumption"
    await page.click('label:has-text("Change Assumption")');

    // Verify assumption dropdown appears
    await expect(page.getByText('Select Assumption to Change')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();

    // Verify the dropdown contains the accessory assumption
    await expect(page.locator('select option:has-text("Accessory Declaration Status")')).toBeVisible();
  });

  test('selecting interpretation change shows interpretation dropdown', async ({ page }) => {
    await runDecisionAndGetReceipt(page);
    await page.click('a:has-text("Simulate Alternative")');

    // Click "Change Interpretation"
    await page.click('label:has-text("Change Interpretation")');

    // Verify interpretation dropdown appears
    await expect(page.getByText('Select Interpretation to Change')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();

    // Verify the dropdown contains the accessory coverage option
    await expect(page.locator('select option:has-text("Accessory Coverage Policy")')).toBeVisible();
  });

  test('changing assumption shows instant delta result', async ({ page }) => {
    // Run decision with NOT_DECLARED (tow bar excluded, lower payout)
    await runDecisionAndGetReceipt(page, 'NOT_DECLARED');
    await page.click('a:has-text("Simulate Alternative")');

    // Select "Change Assumption"
    await page.click('label:has-text("Change Assumption")');

    // Select the accessory assumption from dropdown
    await page.selectOption('select', { label: /Accessory Declaration Status/ });

    // Verify options appear
    await expect(page.getByText('Select New Resolution')).toBeVisible();

    // Select "Assume Declared" (the other option)
    await page.click('label:has-text("Assume Declared")');

    // Verify result section appears
    await expect(page.getByRole('heading', { name: 'Counterfactual Result' })).toBeVisible();

    // Verify "What changed" summary
    await expect(page.getByText('What changed:')).toBeVisible();
    await expect(page.getByText('NOT_DECLARED')).toBeVisible();
    await expect(page.getByText('DECLARED')).toBeVisible();

    // Verify delta is positive (adding tow bar coverage increases payout)
    // The delta should show +CHF format with green color
    await expect(page.locator('text=/\\+CHF/')).toBeVisible();

    // Verify trace diff is shown
    await expect(page.getByText(/Step \d+ .* changed/)).toBeVisible();
  });

  test('changing interpretation shows instant delta result', async ({ page }) => {
    await runDecisionAndGetReceipt(page);
    await page.click('a:has-text("Simulate Alternative")');

    // Select "Change Interpretation"
    await page.click('label:has-text("Change Interpretation")');

    // Select the accessory coverage decision point
    await page.selectOption('select', { label: /Accessory Coverage Policy/ });

    // Verify options appear
    await expect(page.getByText('Select New Option')).toBeVisible();

    // Select "Included By Default" (different from current INCLUDED_IF_DECLARED)
    await page.click('label:has-text("Included By Default")');

    // Verify result section appears
    await expect(page.getByRole('heading', { name: 'Counterfactual Result' })).toBeVisible();

    // Verify delta is shown
    await expect(page.getByText('Delta')).toBeVisible();
  });

  test('payout breakdown comparison table shows before/after', async ({ page }) => {
    await runDecisionAndGetReceipt(page, 'NOT_DECLARED');
    await page.click('a:has-text("Simulate Alternative")');

    // Select assumption change
    await page.click('label:has-text("Change Assumption")');
    await page.selectOption('select', { label: /Accessory Declaration Status/ });
    await page.click('label:has-text("Assume Declared")');

    // Verify breakdown comparison table
    await expect(page.getByText('Payout Breakdown Comparison')).toBeVisible();

    // Verify table headers
    await expect(page.locator('th:has-text("Original")')).toBeVisible();
    await expect(page.locator('th:has-text("New")')).toBeVisible();
    await expect(page.locator('th:has-text("Change")')).toBeVisible();

    // Verify deductible row
    await expect(page.locator('td:has-text("Deductible")')).toBeVisible();

    // Verify net payout row
    await expect(page.locator('td:has-text("Net Payout")')).toBeVisible();
  });

  test('current value option is disabled and marked', async ({ page }) => {
    await runDecisionAndGetReceipt(page, 'NOT_DECLARED');
    await page.click('a:has-text("Simulate Alternative")');

    // Select assumption change
    await page.click('label:has-text("Change Assumption")');
    await page.selectOption('select', { label: /Accessory Declaration Status/ });

    // The "Assume Not Declared" option should be disabled (it's the current value)
    const currentOption = page.locator('label:has-text("Assume Not Declared")');
    await expect(currentOption).toBeVisible();
    await expect(currentOption.locator('input[type="radio"]')).toBeDisabled();
    await expect(currentOption.getByText('(current)')).toBeVisible();
  });

  test('back to receipt button navigates back', async ({ page }) => {
    await runDecisionAndGetReceipt(page);
    const receiptUrl = page.url();

    await page.click('a:has-text("Simulate Alternative")');
    await expect(page.getByRole('heading', { name: 'Counterfactual Simulator' })).toBeVisible();

    // Click back to receipt
    await page.click('a:has-text("Back to Receipt")');

    // Should be back on receipt page
    await expect(page).toHaveURL(receiptUrl);
    await expect(page.getByRole('heading', { name: 'Decision Receipt' })).toBeVisible();
  });

  test('empty state shown when no change is fully selected', async ({ page }) => {
    await runDecisionAndGetReceipt(page);
    await page.click('a:has-text("Simulate Alternative")');

    // Select change type but don't complete selection
    await page.click('label:has-text("Change Assumption")');

    // Empty state should be shown
    await expect(page.getByText('Select a change above to see the counterfactual result')).toBeVisible();
  });

  test('full counterfactual flow: NOT_DECLARED to DECLARED shows +CHF 1,200', async ({ page }) => {
    // This is the primary demo scenario
    // CLM-CH-001 has:
    // - Bumper repair: CHF 1,500 (repair category - always covered)
    // - Paint work: CHF 1,000 (repair category - always covered)
    // - Tow bar: CHF 1,200 (accessory category - depends on assumption)
    // Deductible: CHF 500
    //
    // With NOT_DECLARED: 1500 + 1000 - 500 = CHF 2,000
    // With DECLARED: 1500 + 1000 + 1200 - 500 = CHF 3,200
    // Delta: +CHF 1,200

    await runDecisionAndGetReceipt(page, 'NOT_DECLARED');

    // Verify base payout (CHF 2,000)
    await expect(page.locator('text=/CHF\\s*2[\\s,\\.]*000/')).toBeVisible();

    await page.click('a:has-text("Simulate Alternative")');

    // Change assumption to DECLARED
    await page.click('label:has-text("Change Assumption")');
    await page.selectOption('select', { label: /Accessory Declaration Status/ });
    await page.click('label:has-text("Assume Declared")');

    // Verify the new payout shows CHF 3,200
    await expect(page.locator('.border-primary >> text=/CHF\\s*3[\\s,\\.]*200/')).toBeVisible();

    // Verify delta shows +CHF 1,200
    await expect(page.locator('text=/\\+CHF\\s*1[\\s,\\.]*200/')).toBeVisible();

    // Verify trace diff mentions the assumption step changed
    await expect(page.getByText(/Apply Assumption.*changed/)).toBeVisible();
  });
});
