# Decision Ledger Demo

A polished, interactive demo showcasing how a Decision Ledger enables:

- **Deterministic, versioned decisions** (not "AI vibes")
- **Explicit interventions** (interpretations) and **assumptions** when facts are unknown
- **Decision Receipt** artifacts suitable for audit/dispute handling
- **Counterfactual simulation** ("what if we used a different approved interpretation/assumption?")
- **QA/Leakage impact view** across a cohort of claims

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
pip install -e ".[dev]"
uvicorn src.decision_ledger.api.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
DecisionLedger/
├── backend/                 # Python/FastAPI backend
│   ├── src/decision_ledger/ # Main package
│   │   ├── api/             # Routes and services
│   │   ├── core/            # Decision engine
│   │   ├── schemas/         # Pydantic models
│   │   └── storage/         # Data persistence
│   ├── tests/               # PyTest tests
│   └── fixtures/            # JSON data fixtures
│
├── frontend/                # React/TypeScript frontend
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── context/         # React contexts
│   │   ├── pages/           # Page components
│   │   └── types/           # TypeScript types
│   └── e2e/                 # Playwright tests
│
├── .claude/docs/            # Reference documentation
├── .project/                # Project state (backlog)
├── scripts/                 # Development scripts
└── CLAUDE.md                # AI assistant instructions
```

## Demo Scenario

**CH Motor / Casco** - A rear-end collision claim with aftermarket tow bar damage, where the "accessory declared" status is unknown.

This scenario demonstrates:
1. **Assumption resolution** - Unknown fact requires explicit handling
2. **Interpretation selection** - Policy rules applied via governed decision points
3. **Audit trail** - Full trace of decision logic
4. **Counterfactual analysis** - "What if" with different choices

## Tech Stack

- **Backend**: Python 3.9+, FastAPI, Pydantic
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui patterns
- **Data**: File-based JSON fixtures
- **Theming**: Dark/light mode with multiple color themes

## Running Tests

```bash
# Backend tests
cd backend && python -m pytest tests/unit/ --no-cov -q

# Frontend tests
cd frontend && npm run test

# E2E tests
cd frontend && npx playwright test
```

## License

Proprietary - Demo purposes only.
