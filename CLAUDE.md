# Decision Ledger

A demo application showcasing deterministic, versioned decision-making for insurance claims. Enables explicit interventions (interpretations and assumptions), audit-ready decision receipts, counterfactual simulation, and QA impact analysis.

## Stack

Python 3.9+ / FastAPI / Pydantic | React 18 / TypeScript / Tailwind / shadcn-ui | File-based JSON

## Commands

```bash
# Backend
cd backend && uvicorn src.decision_ledger.api.main:app --reload --port 8000

# Frontend
cd frontend && npm run dev

# Tests
cd backend && python -m pytest tests/unit/ --no-cov -q    # Fast backend tests
cd frontend && npm run test                                # Frontend unit tests
cd frontend && npx playwright test                         # E2E tests
```

## Conventions

- Python: snake_case | TypeScript: camelCase | Classes: PascalCase
- Test new/changed logic with PyTest or Vitest
- Do not start/stop dev servers automatically - ask user first

## Versioning & Commits

**Current version**: Check `backend/pyproject.toml` and `frontend/package.json` - kept in sync.

### Commit Message Prefixes

- `fix:` - Bug fix (PATCH bump)
- `feat:` - New feature (MINOR bump)
- `BREAKING CHANGE:` - Breaking change (MAJOR bump)
- `chore:` - Maintenance, deps (no version bump)
- `docs:` - Documentation only (no version bump)
- `refactor:` - Code restructure (no version bump)
- `test:` - Adding/updating tests (no version bump)

## Testing Best Practices

- **Full suite is fast**: Run with `--no-cov` to skip coverage (significantly faster)
- **Use `-k` for keyword filtering**: `pytest -k "engine" --tb=short`
- **Use `--tb=short`** for concise error output

## Context Management

- **backlog.json** - All tasks in JSON format at `.project/backlog.json`. Update before clearing context.
- **.claude/docs/** - Reference documentation for architecture, testing, workflows
- Before `/clear`: Add handoff notes to backlog.json

## Key Paths

- Backend: `backend/src/decision_ledger/`
- Frontend: `frontend/src/`
- Tests: `backend/tests/`, `frontend/e2e/`
- Fixtures: `backend/fixtures/`

## Demo Scenario

Primary demo: **CH Motor/Casco** - rear-end collision with aftermarket tow bar damage where "accessory declared" status is unknown. This triggers:

1. An **assumption** resolution (is the accessory declared?)
2. An **interpretation** choice (how to handle accessory coverage)
3. Clean counterfactual deltas showing impact of different choices

## Key Data Models

- **Claim**: Insurance claim with facts (KNOWN/UNKNOWN), evidence, line items
- **InterpretationSet**: Governed decision points with versioning
- **AssumptionSet**: Governed assumptions with role-based access control
- **DecisionRun**: Ledger event capturing the full decision with trace
- **CounterfactualRun**: What-if simulation with exactly one change

## Decision Engine Rules (CH Motor)

- Base repair items: Always covered
- Accessory items: Coverage depends on:
  - ACCESSORY_COVERAGE interpretation (INCLUDED_IF_DECLARED | INCLUDED_BY_DEFAULT | EXCLUDED)
  - accessory_declared assumption resolution (DECLARED | NOT_DECLARED)
- Standard deductible: 500 CHF
