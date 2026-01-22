# Decision Ledger - Handoff Notes

**Date**: 2026-01-22
**Context**: Project setup complete, ready to start UI implementation

---

## Current State

### What's Done

1. **Project Structure** - Full monorepo setup per IMPLEMENTATION_GUIDELINES.md
   - `backend/` - FastAPI placeholder (not needed for demo MVP)
   - `frontend/` - React 18 + TypeScript + Tailwind + shadcn-ui patterns
   - `.claude/docs/` - Architecture, testing, workflows documentation
   - `.project/backlog.json` - 47 user stories across 12 epics
   - `scripts/` - PowerShell dev scripts
   - `CLAUDE.md` - AI assistant instructions

2. **Frontend Foundation**
   - Vite + React 18 + TypeScript configured
   - Tailwind CSS with 3 color themes (Northern Lights, Default, Pink)
   - Dark/light mode with `@space-man/react-theme-animation`
   - App shell: Sidebar nav, Header with role selector, theme toggle, breadcrumbs
   - React Router with all routes defined
   - AppContext for role + decision runs state
   - TypeScript types matching the data model
   - API client (ready but won't be used initially)
   - 13 placeholder pages created

3. **Backend Placeholder**
   - FastAPI structure with routes, services, schemas
   - Decision engine with CH Motor logic (Python version)
   - Empty JSON fixture files in `backend/fixtures/`
   - **Decision: Backend is placeholder only - demo is frontend-only**

4. **Documentation**
   - PRD in `scratch/MVP-PRD.md`
   - Theming guide in `scratch/theming-standalone.md`
   - Implementation guidelines in `scratch/IMPLEMENTATION_GUIDELINES.md`

---

## Key Decisions

1. **Frontend-only demo** - No backend needed for MVP. Fixtures loaded directly in frontend.
2. **Option A selected** - Decision engine will be TypeScript in frontend
3. **Scenario A only** - CH Motor/Casco (Switzerland), skip US Auto scenario
4. **Pre-computed QA results** - No real-time simulation needed
5. **PDF export** - Stub only (toast message)

---

## Next Steps - Critical Path

Start with fixtures, then build the core demo flow:

| Priority | Task | Description |
|----------|------|-------------|
| **1** | **Populate fixtures** | Move to `frontend/src/data/` and create: |
| | S2.3 | `claims.json` - 10 CH Motor claims, primary CLM-CH-001 has UNKNOWN accessory_declared |
| | S2.4 | `interpretation_sets.json` - ACCESSORY_COVERAGE decision point |
| | S2.5 | `assumption_sets.json` - ACCESSORY_DECLARED assumption |
| **2** | **Claims UI** | |
| | S4.1 | Claims list page with table |
| | S4.3 | Claim detail with facts (highlight UNKNOWN), evidence, line items |
| **3** | **Decision Engine (TS)** | |
| | S2.7 | Port Python engine to TypeScript in frontend |
| **4** | **Decision Wizard** | |
| | S5.1 | Setup step - show versioned sets |
| | S5.2 | Resolve assumptions step - radio buttons, reason input |
| **5** | **Decision Receipt** | |
| | S6.1-S6.4 | Summary, governance block, resolved unknowns, trace preview |

This completes **Demo Flow 1 (Adjuster run)** - the core value demonstration.

---

## File Locations

### To Create/Modify Next
- `frontend/src/data/claims.json` - Fixture data
- `frontend/src/data/interpretation_sets.json`
- `frontend/src/data/assumption_sets.json`
- `frontend/src/lib/engine.ts` - TypeScript decision engine
- `frontend/src/pages/ClaimsListPage.tsx` - Implement
- `frontend/src/pages/ClaimDetailPage.tsx` - Implement
- `frontend/src/pages/DecisionWizardPage.tsx` - Implement
- `frontend/src/pages/DecisionReceiptPage.tsx` - Implement

### Reference Files
- `scratch/MVP-PRD.md` - Full PRD with screen specs
- `.project/backlog.json` - All user stories with acceptance criteria
- `backend/src/decision_ledger/core/engine.py` - Python engine to port
- `backend/tests/conftest.py` - Sample fixture data structures
- `frontend/src/types/index.ts` - TypeScript interfaces (already complete)

---

## Demo Scenario Details

**Primary Claim: CLM-CH-001**
- Jurisdiction: CH (Switzerland)
- Product: Motor/Casco
- Incident: Rear-end collision
- Key fact: `accessory_declared` = UNKNOWN
- Line items: Base repair (~2500 CHF) + Tow bar (~1200 CHF)

**Decision Logic:**
- Base repair: Always covered
- Tow bar (accessory): Depends on:
  - Interpretation `ACCESSORY_COVERAGE`: INCLUDED_IF_DECLARED | INCLUDED_BY_DEFAULT | EXCLUDED
  - Assumption `ACCESSORY_DECLARED`: DECLARED | NOT_DECLARED
- Deductible: 500 CHF

**Expected Outcomes:**
- If NOT_DECLARED + INCLUDED_IF_DECLARED → Payout: 2000 CHF (repair - deductible)
- If DECLARED + INCLUDED_IF_DECLARED → Payout: 3200 CHF (repair + tow bar - deductible)

---

## Commands

```bash
# Frontend dev
cd frontend && npm install && npm run dev

# Backend (placeholder, not needed yet)
cd backend && pip install -e ".[dev]"
cd backend && uvicorn src.decision_ledger.api.main:app --reload --port 8000
```

---

## Notes

- The `@space-man/react-theme-animation` package may need to be verified/installed
- shadcn/ui components need to be added as needed (Button, Card, Table, etc.)
- Role selector already works and persists in context
- Reset demo data clears decision runs and resets role to Adjuster
