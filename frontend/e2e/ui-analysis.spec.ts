import { test } from '@playwright/test';

test.describe('UI Analysis Screenshots', () => {
  test('capture all screens for UI analysis', async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 1. Claims List Page
    await page.goto('/claims');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/01-claims-list.png', fullPage: true });

    // 2. Claim Detail Page
    await page.goto('/claims/CLM-2024-00542');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/02-claim-detail.png', fullPage: true });

    // 3. Decision Wizard Page - Step 1
    await page.goto('/claims/CLM-2024-00542/decide');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/03-decision-wizard-step1.png', fullPage: true });

    // 4. Decision Runs List Page
    await page.goto('/decision-runs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/04-decision-runs.png', fullPage: true });

    // 5. Decision Receipt Page
    await page.goto('/decision-runs/RUN-001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/05-decision-receipt.png', fullPage: true });

    // 6. Trace Viewer Page
    await page.goto('/decision-runs/RUN-001/trace');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/06-trace-viewer.png', fullPage: true });

    // 7. Counterfactual Page
    await page.goto('/decision-runs/RUN-001/counterfactual');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/07-counterfactual.png', fullPage: true });

    // 8. Governance Page
    await page.goto('/governance');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/08-governance.png', fullPage: true });

    // 9. New Proposal Page
    await page.goto('/governance/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/09-new-proposal.png', fullPage: true });

    // 10. Proposal Detail Page
    await page.goto('/governance/PROP-001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/10-proposal-detail.png', fullPage: true });

    // 11. QA Impact Page
    await page.goto('/qa-impact');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/11-qa-impact.png', fullPage: true });

    // 12. Catalogs Page
    await page.goto('/catalogs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/12-catalogs.png', fullPage: true });
  });
});
