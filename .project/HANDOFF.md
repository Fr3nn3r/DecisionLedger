# Decision Ledger - Handoff Notes

**Date**: 2026-01-22
**Session**: Counterfactual Simulator + E2E tests complete

---

## Current State

### Completed Epics
- **E1** - Project Setup & Infrastructure
- **E2** - Core Data Models & Demo Engine
- **E3** - App Shell & Navigation
- **E4** - Claims Module
- **E5** - Decision Wizard
- **E6** - Decision Receipt
- **E7** - Trace Viewer
- **E8** - Counterfactual Simulator (NEW)
- **E11** - Catalogs Module

### Progress Summary
- **39 stories completed** out of 50
- **9 epics completed** (E1-E8, E11)
- **78% complete** by story count

---

## What's Working

### 1. Decision Engine (`frontend/src/services/decisionEngine.ts`)
- **Base coverage**: 'repair' category items always covered
- **Accessory coverage**: Based on interpretation + assumption resolution
  - INCLUDED_BY_DEFAULT -> always covered
  - EXCLUDED -> never covered
  - INCLUDED_IF_DECLARED + DECLARED -> covered
  - INCLUDED_IF_DECLARED + NOT_DECLARED -> not covered
- **Deductible**: 500 CHF applied to gross total
- **Trace generation**: 7-step trace with facts, assumptions, interpretations, line items, payout, deductible, outcome
- **50 unit tests passing**

### 2. Claims Module (`/claims`, `/claims/:claimId`)
- Claims list with sortable columns, filters (search, jurisdiction, product)
- Claim detail with facts (UNKNOWN highlighted yellow), evidence, line items
- "Run Decision" button navigates to wizard

### 3. Decision Wizard (`/claims/:claimId/decide`)
- 3-step wizard: Setup -> Resolve Assumptions -> Complete
- Shows governance sets with versions
- Radio buttons for assumption resolution with role restrictions
- Real payouts displayed based on interpretation/assumption choices

### 4. Decision Receipt (`/decision-runs/:runId`)
- Summary with status badge, payout breakdown table
- Governance block (run ID, timestamp, role, versions)
- Resolved assumptions section (yellow highlight)
- Key decision steps preview (first 3 trace steps)
- Action buttons: View Trace, Simulate Alternative, Export PDF

### 5. Trace Viewer (`/decision-runs/:runId/trace`)
- Vertical stepper with numbered steps and connector lines
- Clickable steps to view details
- Details panel showing: inputs, outputs, rule refs, evidence refs
- Determinism note explaining audit trail

### 6. Counterfactual Simulator (`/decision-runs/:runId/counterfactual`) - NEW
- Base run info display (run_id, timestamp, status, payout)
- Change type selector: Assumption vs Interpretation (radio cards)
- Dynamic dropdown for selecting which item to change
- Radio options for new values (current value disabled)
- **Instant reactive updates** via useMemo re-running decision engine
- Results display with:
  - Delta showing +/- CHF with color coding (green/red)
  - "What changed" summary
  - Trace diff highlighting which step changed
  - Payout breakdown comparison table

### 7. Catalogs Module (`/catalogs`)
- Tab navigation: Interpretations | Assumptions
- Expandable rows showing options, risk tiers, role restrictions
- Draft Proposal buttons (role-gated)

### 8. E2E Test Coverage
- **34 total e2e tests** (all passing)
- **12 counterfactual tests** covering:
  - Navigation to/from simulator
  - Change type selector (assumption/interpretation)
  - Dropdown selection for items to change
  - Instant delta result display
  - Payout breakdown comparison table
  - Current value disabled state
  - Full demo flow (NOT_DECLARED → DECLARED = +CHF 1,200)
- Other test files: navigation, claims-list, claim-detail, decision-wizard, demo-flow

---

## Demo Flows

### Flow 1: Adjuster Decision Run
1. `/claims` -> Click CLM-CH-001
2. Click "Run Decision"
3. Setup step: See governance sets (Interpretation Set 2025.1, Assumption Set 2025.1)
4. Resolve Assumptions: Choose DECLARED or NOT_DECLARED for accessory
5. Complete: See outcome (Approved/Partial with real payout)
6. View Receipt -> View Trace

### Flow 2: Counterfactual Simulation (NEW)
1. From any receipt, click "Simulate Alternative"
2. Choose "Change Assumption" or "Change Interpretation"
3. Select which item to change from dropdown
4. Select new value - results update instantly
5. See delta (e.g., +CHF 1,200) and trace diff
6. Compare payout breakdown before/after

### Flow 3: Trace Viewer
1. From any receipt, click "View Trace"
2. See 7-step decision trace
3. Click steps to see inputs, outputs, rules applied

### Flow 4: Counterfactual (Next)
- QA Impact Module needs S9.1, S9.2, S9.3

### Flow 5: Governance
- Needs S10.1-S10.4

---

## Key Files

### Decision Engine
- `frontend/src/services/decisionEngine.ts` - Full implementation
- `frontend/src/services/decisionEngine.test.ts` - 20 tests
- `frontend/src/services/__tests__/decisionEngine.test.ts` - 30 tests

### Pages
- `frontend/src/pages/ClaimsListPage.tsx`
- `frontend/src/pages/ClaimDetailPage.tsx`
- `frontend/src/pages/DecisionWizardPage.tsx`
- `frontend/src/pages/DecisionReceiptPage.tsx`
- `frontend/src/pages/TraceViewerPage.tsx`
- `frontend/src/pages/CounterfactualPage.tsx` - NEW
- `frontend/src/pages/CatalogsPage.tsx`

### Data
- `frontend/src/data/claims.json` - 10 CH Motor claims
- `frontend/src/data/interpretation_sets.json` - 2 versions
- `frontend/src/data/assumption_sets.json` - 2 versions

### E2E Tests
- `frontend/e2e/counterfactual.spec.ts` - 12 tests for counterfactual flow
- `frontend/e2e/demo-flow.spec.ts` - Full demo flow tests
- `frontend/e2e/decision-wizard.spec.ts` - Wizard flow tests
- `frontend/e2e/claims-list.spec.ts` - Claims list and filtering
- `frontend/e2e/claim-detail.spec.ts` - Claim detail page
- `frontend/e2e/navigation.spec.ts` - Sidebar navigation

---

## What's Next

| Story | Description | Points |
|-------|-------------|--------|
| **S9.1** | QA Impact: Cohort and proposal selectors | 3 |
| **S9.2** | QA Impact: Results dashboard | 3 |
| **S9.3** | QA Impact: Top impacted claims list | 3 |
| **S10.1** | Governance: Proposal list | 3 |
| **S10.2** | Governance: Proposal form | 5 |

---

## Commands

```bash
# Run unit tests (50 tests)
cd frontend && npm run test

# Run e2e tests (34 tests) - requires dev server running
cd frontend && npm run test:e2e

# Run e2e with UI
cd frontend && npm run test:e2e:ui

# Type check
cd frontend && npx tsc --noEmit --skipLibCheck

# Start dev server (ask user first)
cd frontend && npm run dev
```

---

## How to Test Counterfactual

1. Go to `http://localhost:5173/claims`
2. Click **CLM-CH-001** (has UNKNOWN accessory fact)
3. Click **"Run Decision"**
4. Step 2: Choose **NOT_DECLARED** -> tow bar excluded, payout = CHF 2,000
5. Click **"View Receipt"** -> **"Simulate Alternative"**
6. Select **"Change Assumption"** -> **Accessory Declaration Status**
7. Select **"DECLARED"** as new value
8. See instant result: **+CHF 1,200** delta, payout goes from CHF 2,000 to CHF 3,200
9. Trace diff shows: "Step 2 (Apply Assumption: Accessory Declaration Status) changed"

**Note**: Decision runs are stored in memory and lost on page refresh.
