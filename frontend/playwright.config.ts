import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Decision Ledger E2E tests.
 *
 * IMPORTANT: Tests run against the existing dev server at localhost:5173.
 * Start the server manually before running tests: `npm run dev`
 * We do NOT auto-start a server to avoid conflicts with already-running instances.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Chromium only - no need for cross-browser testing
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer config - use existing dev server on localhost:5173
});
