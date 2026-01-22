# Testing Guide

## Test Philosophy

- **Fast feedback**: Unit tests should complete in seconds
- **Isolation**: Tests should not depend on external services
- **Determinism**: Decision engine tests must verify same inputs → same outputs
- **Readability**: Test names should describe the behavior being tested

## Backend Tests

### Running Tests

```bash
# Fast: skip coverage
python -m pytest tests/unit/ --no-cov -q

# Verbose: see details
python -m pytest tests/unit/ -v --tb=short

# Filtered: by keyword
python -m pytest -k "engine" --tb=short

# With coverage (slower)
python -m pytest tests/ --cov=src/decision_ledger
```

### Test Structure

```
backend/tests/
├── unit/                  # Fast, isolated tests
│   ├── test_engine.py     # Decision engine tests
│   └── ...
├── integration/           # Multi-component tests
│   └── test_api_flows.py
├── fixtures/              # Shared test data
└── conftest.py            # Shared fixtures
```

### Key Test Fixtures (conftest.py)

- `sample_claim` - CH Motor claim with unknown accessory_declared fact
- `sample_interpretation_set` - ACCESSORY_COVERAGE decision point
- `sample_assumption_set` - ACCESSORY_DECLARED assumption with alternatives
- `temp_storage` - Isolated storage for each test

### Test Patterns

```python
def test_<action>_<condition>_<expected_result>():
    # Arrange
    engine = DecisionEngine()
    resolved = [ResolvedAssumption(...)]
    selected = [SelectedInterpretation(...)]

    # Act
    outcome, trace = engine.run(claim, ...)

    # Assert
    assert outcome.payout_total == expected_amount
    assert outcome.status == DecisionStatus.APPROVED
```

### Decision Engine Test Cases

1. **Accessory not declared** → accessory excluded, lower payout
2. **Accessory declared** → accessory included, higher payout
3. **Excluded interpretation** → accessory excluded regardless of declaration
4. **Determinism** → same inputs produce identical outputs
5. **Trace diff** → correctly identifies changed step

## Frontend Tests

### Unit Tests (Vitest)

```bash
npm run test           # Run all
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

### E2E Tests (Playwright)

```bash
npx playwright test           # Headless
npx playwright test --ui      # Interactive UI
npx playwright test --headed  # See browser
```

### E2E Test Scenarios

1. **Adjuster flow**: Claims → CH claim → Run Decision → Receipt
2. **Counterfactual**: Simulate Alternative → see delta
3. **QA Impact**: Select cohort → view impact → drill down
4. **Governance**: Create proposal → approve → publish

## Testing the Demo Flow

Manual verification checklist:

- [ ] CH claim can be decided end-to-end
- [ ] Receipt shows run_id, versions, resolved assumptions, payout breakdown
- [ ] Counterfactual shows delta and changed step
- [ ] QA Impact shows cohort metrics
- [ ] Role switch affects available options
- [ ] Reset demo data works
