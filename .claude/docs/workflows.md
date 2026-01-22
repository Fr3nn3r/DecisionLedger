# Development Workflows

## Starting Development

### Backend

```bash
cd backend

# First time: install dependencies
pip install -e ".[dev]"

# Start server
uvicorn src.decision_ledger.api.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# First time: install dependencies
npm install

# Start dev server
npm run dev
```

## Before Committing

```bash
# Run backend tests
cd backend && python -m pytest tests/unit/ --no-cov -q

# Run frontend tests
cd frontend && npm run test

# Check TypeScript types
cd frontend && npm run type-check
```

## Adding a New Feature

1. Update backlog.json with the task
2. Create/update Pydantic schema in `backend/src/decision_ledger/schemas/`
3. Add TypeScript types in `frontend/src/types/index.ts`
4. Implement backend route/service
5. Implement frontend page/component
6. Write tests
7. Update documentation if needed

## Adding a New API Endpoint

1. Define Pydantic request/response models in `schemas/`
2. Create route handler in `api/routes/`
3. Implement business logic in `api/services/`
4. Add to router in `api/main.py` if new router
5. Add API client function in `frontend/src/api/client.ts`
6. Write tests

## Working with Fixtures

Fixtures are in `backend/fixtures/`:
- `claims.json` - 10 CH Motor claims
- `interpretation_sets.json` - Versioned interpretation sets
- `assumption_sets.json` - Versioned assumption sets
- `qa_results.json` - Pre-computed QA study results
- `qa_cohorts.json` - Available cohorts
- `qa_proposed_changes.json` - Available proposed changes

To modify fixtures:
1. Edit JSON files directly
2. Restart backend (or clear cache)
3. Verify in frontend

## Demo Flow Rehearsal

### Flow 1: Adjuster Run (2-3 min)
1. Claims → open CLM-CH-001
2. Show fact table: "Accessory declared = UNKNOWN"
3. Run Decision → Setup shows versioned sets
4. Resolve Assumption → accept recommended
5. Generate Receipt → show payout + resolved unknowns + versions

### Flow 2: Counterfactual (2 min)
6. Click "Simulate Alternative"
7. Toggle one lever (assumption OR interpretation)
8. Show delta + trace diff

### Flow 3: QA/Leakage (2-3 min)
9. QA Impact → pick CH cohort → choose proposal → view impact
10. Click top impacted claim → show receipt

### Flow 4: Governance (1-2 min)
11. Create change proposal → show approvals → "Publish"
12. Re-run CH claim → show new default applied

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.9+)
- Check dependencies: `pip install -e ".[dev]"`
- Check port not in use: `lsof -i :8000`

### Frontend won't start
- Check Node version: `node --version`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check port not in use: `lsof -i :5173`

### API calls failing
- Check backend is running on port 8000
- Check CORS origins in backend config
- Check Vite proxy configuration
