# Architecture Overview

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │
│  │ Pages   │  │Components│  │ Hooks   │  │  Contexts   │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └──────┬──────┘    │
│       └────────────┴────────────┴───────────────┘           │
│                           │ API Client                       │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP (JSON)
┌───────────────────────────┼─────────────────────────────────┐
│                     Backend (FastAPI)                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │
│  │ Routes  │→ │Services │→ │  Core   │→ │   Storage   │    │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Request** → Frontend sends HTTP request to Backend API
2. **Route** → FastAPI route handler receives request
3. **Service** → Business logic layer processes request
4. **Core/Engine** → Decision engine computes deterministic outcome
5. **Storage** → Data is loaded from JSON fixtures
6. **Response** → Result returned to Frontend

## Backend Modules

### `api/routes/`
HTTP endpoint handlers organized by domain:
- `claims.py` - Claim listing and retrieval
- `decisions.py` - Decision execution and counterfactuals
- `governance.py` - Change proposal management
- `catalogs.py` - Interpretation/assumption set access
- `qa.py` - QA impact simulation

### `api/services/`
Business logic layer:
- `claims_service.py` - Claim data access
- `decision_service.py` - Decision execution orchestration
- `governance_service.py` - Proposal lifecycle management
- `catalog_service.py` - Catalog data access
- `qa_service.py` - QA simulation results

### `core/`
Domain logic:
- `engine.py` - Deterministic decision engine (CH Motor rules)

### `schemas/`
Pydantic models:
- `claim.py` - Claim, Fact, Evidence, LineItem
- `catalog.py` - InterpretationSet, AssumptionSet
- `decision.py` - DecisionRun, Outcome, Trace
- `governance.py` - ChangeProposal
- `qa.py` - QAStudyResult

### `storage/`
Data persistence:
- `protocol.py` - Storage interface definition
- `filesystem.py` - JSON fixture loader

## Frontend Structure

### `pages/`
Route-level components:
- ClaimsListPage, ClaimDetailPage
- DecisionWizardPage, DecisionReceiptPage
- TraceViewerPage, CounterfactualPage
- QAImpactPage, GovernancePage, CatalogsPage

### `components/`
- `shared/` - AppShell, Sidebar, Header, Breadcrumbs, ThemePopover

### `context/`
- `AppContext.tsx` - Global state (role, decision runs)

### `api/`
- `client.ts` - API client functions

### `types/`
- `index.ts` - TypeScript interfaces matching backend models

## Decision Engine Logic

```
Claim + InterpretationSet + AssumptionSet + Resolutions
                          ↓
                   Decision Engine
                          ↓
              Deterministic Outcome + Trace

Same inputs → Same outputs (always)
```

Key rules for CH Motor:
1. Base repair items always covered
2. Accessory coverage depends on interpretation + assumption
3. 500 CHF deductible applied
4. Trace captures each step with inputs, rules, outputs

## Counterfactual Flow

```
Base DecisionRun + Exactly One Change
                 ↓
           Re-run Engine
                 ↓
    New Outcome + Delta + TraceDiff
```

Constraints:
- Only ONE change allowed per counterfactual
- Either assumption OR interpretation, not both
- TraceDiff shows which step changed
