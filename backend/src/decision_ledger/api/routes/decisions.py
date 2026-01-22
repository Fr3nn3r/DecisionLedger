"""Decisions API routes."""

from fastapi import APIRouter, HTTPException

from decision_ledger.schemas.decision import (
    DecisionRun,
    DecisionRunRequest,
    CounterfactualRequest,
    CounterfactualRun,
)
from decision_ledger.api.services.decision_service import DecisionService

router = APIRouter()
decision_service = DecisionService()


@router.get("", response_model=list[DecisionRun])
async def list_decision_runs(claim_id: str | None = None) -> list[DecisionRun]:
    """List all decision runs, optionally filtered by claim."""
    return decision_service.list_runs(claim_id=claim_id)


@router.get("/{run_id}", response_model=DecisionRun)
async def get_decision_run(run_id: str) -> DecisionRun:
    """Get a single decision run by ID."""
    run = decision_service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Decision run {run_id} not found")
    return run


@router.post("/run", response_model=DecisionRun)
async def run_decision(request: DecisionRunRequest) -> DecisionRun:
    """Execute a decision run for a claim."""
    return decision_service.run_decision(request)


@router.post("/counterfactual", response_model=CounterfactualRun)
async def run_counterfactual(request: CounterfactualRequest) -> CounterfactualRun:
    """Execute a counterfactual simulation."""
    return decision_service.run_counterfactual(request)
