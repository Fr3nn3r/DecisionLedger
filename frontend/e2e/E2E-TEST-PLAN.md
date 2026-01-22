# E2E Test Plan - Decision Ledger

## Overview

This document outlines the happy-path E2E scenarios for Playwright testing. Focus is on navigation flows and core user journeys.

---

## Test Scenarios

### 1. Navigation & App Shell

**File:** `navigation.spec.ts`

```typescript
// Scenario 1.1: Default redirect
// - Navigate to /
// - Should redirect to /claims

// Scenario 1.2: Sidebar navigation
// - Click each nav item: Claims, Decision Runs, QA Impact, Governance, Catalogs
// - Verify URL changes and page title/heading is correct

// Scenario 1.3: 404 handling
// - Navigate to /invalid-route
// - Should show Not Found page
```

---

### 2. Claims List & Filtering

**File:** `claims-list.spec.ts`

```typescript
// Scenario 2.1: View claims list
// - Navigate to /claims
// - Should display table with claims
// - Table should have columns: Claim ID, Product, Loss Date, Status

// Scenario 2.2: Filter by search
// - Type "001" in search input
// - Should filter to show only CLM-CH-001
// - Results count should update

// Scenario 2.3: Clear filters
// - Apply a filter
// - Click "Clear filters"
// - All claims should be visible again

// Scenario 2.4: Navigate to claim detail
// - Click on claim ID link (CLM-CH-001)
// - Should navigate to /claims/CLM-CH-001
```

---

### 3. Claim Detail

**File:** `claim-detail.spec.ts`

```typescript
// Scenario 3.1: View claim details
// - Navigate to /claims/CLM-CH-001
// - Should show claim header (ID, policy, jurisdiction, loss date)
// - Should show facts table
// - Should show evidence list
// - Should show line items

// Scenario 3.2: UNKNOWN facts highlighted
// - Verify UNKNOWN facts have yellow background/badge
// - CLM-CH-001 should have "Accessory Declared" as UNKNOWN

// Scenario 3.3: Navigate to decision wizard
// - Click "Run Decision" button
// - Should navigate to /claims/CLM-CH-001/decide
```

---

### 4. Decision Wizard Flow (Primary Happy Path)

**File:** `decision-wizard.spec.ts`

```typescript
// Scenario 4.1: Full wizard flow - Claim with UNKNOWN fact
// Steps:
// 1. Navigate to /claims/CLM-CH-001/decide
// 2. SETUP STEP:
//    - Verify governance context cards visible (Interpretation Set, Assumption Set)
//    - Verify "1 Assumption Required" warning shown
//    - Click "Continue"
// 3. RESOLVE ASSUMPTIONS STEP:
//    - Verify assumption for "Accessory Declared" is shown
//    - Recommended option should be pre-selected
//    - Click "Generate Decision"
// 4. COMPLETE STEP:
//    - Verify "Decision Generated" message
//    - Verify Run ID is shown
//    - Verify Status and Payout are displayed
//    - Click "View Receipt"
// 5. Should navigate to /decision-runs/{runId}

// Scenario 4.2: Wizard flow - Claim with no UNKNOWN facts
// Use a claim where all facts are KNOWN (e.g., CLM-CH-002)
// Steps:
// 1. Navigate to /claims/CLM-CH-002/decide
// 2. SETUP STEP:
//    - Verify "No Assumptions Required" message
//    - Click "Continue"
// 3. RESOLVE ASSUMPTIONS STEP:
//    - Should show "No Assumptions Needed" message
//    - Click "Generate Decision"
// 4. COMPLETE STEP:
//    - Verify decision generated
//    - Click "View Receipt"

// Scenario 4.3: Back navigation in wizard
// - Start wizard, advance to step 2
// - Click "Back" button
// - Should return to step 1
// - Click stepper step 1
// - Should navigate back
```

---

### 5. Decision Receipt

**File:** `decision-receipt.spec.ts`

```typescript
// Scenario 5.1: View decision receipt
// Prerequisite: Complete a decision run first (or use existing one)
// - Navigate to /decision-runs/{runId}
// - Should show:
//   - Status badge (Approved/Partial/Denied)
//   - Total payout amount
//   - Payout breakdown table
//   - Governance block (interpretation set, assumption set, versions)
//   - Resolved assumptions section (if any)
//   - Key decision steps

// Scenario 5.2: Receipt action buttons
// - "View Full Trace" button should be visible
// - "Simulate Alternative" button should be visible
// - "Export Receipt (PDF)" button should show toast (stub)
```

---

### 6. Decision Runs List

**File:** `decision-runs.spec.ts`

```typescript
// Scenario 6.1: View decision runs
// Prerequisite: At least one decision run exists
// - Navigate to /decision-runs
// - Should show table of decision runs
// - Each row should show: Run ID, Claim ID, Timestamp, Status, Payout

// Scenario 6.2: Navigate to receipt from list
// - Click on a run ID
// - Should navigate to /decision-runs/{runId}
```

---

### 7. Role Switching

**File:** `role-switching.spec.ts`

```typescript
// Scenario 7.1: Change role via header
// - Default role should be "Adjuster"
// - Click role selector dropdown
// - Select "Supervisor"
// - Dropdown should update to show "Supervisor"

// Scenario 7.2: Role persists across navigation
// - Change role to "QA Lead"
// - Navigate to different pages
// - Role should remain "QA Lead"
```

---

### 8. Full Demo Flow (Integration)

**File:** `demo-flow.spec.ts`

```typescript
// Scenario 8.1: Complete primary demo flow
// This tests the core demo scenario end-to-end:
// 1. Start at /claims
// 2. Click on CLM-CH-001 (tow bar scenario)
// 3. Verify UNKNOWN fact "Accessory Declared"
// 4. Click "Run Decision"
// 5. Progress through wizard (Setup → Resolve Assumptions → Complete)
// 6. View Receipt
// 7. Verify decision shows in Decision Runs list
// 8. Navigate back to claims
```

---

## Test Data

| Claim ID | Has UNKNOWN Facts | Notes |
|----------|-------------------|-------|
| CLM-CH-001 | Yes (Accessory Declared) | Primary demo claim - tow bar |
| CLM-CH-002 | No | All facts KNOWN |
| CLM-CH-003 | No | Simple repair claim |

---

## Setup Notes

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Package.json scripts

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## Priority Order

1. **Navigation** - Foundation for all other tests
2. **Claims List** - Entry point
3. **Decision Wizard** - Core value prop
4. **Decision Receipt** - Validates output
5. **Demo Flow** - Full integration
6. **Decision Runs** - Secondary flow
7. **Role Switching** - Feature testing

---

## Notes

- All tests assume dev server running on localhost:5173
- Tests should be independent and not rely on shared state
- Use `test.beforeEach` to reset to known state if needed
- Decision runs are stored in React context (memory), so state resets on page refresh
