"""Governance API routes."""

from fastapi import APIRouter, HTTPException

from decision_ledger.schemas.governance import (
    ChangeProposal,
    ChangeProposalCreate,
    ChangeProposalUpdate,
)
from decision_ledger.api.services.governance_service import GovernanceService

router = APIRouter()
governance_service = GovernanceService()


@router.get("/proposals", response_model=list[ChangeProposal])
async def list_proposals() -> list[ChangeProposal]:
    """List all change proposals."""
    return governance_service.list_proposals()


@router.get("/proposals/{proposal_id}", response_model=ChangeProposal)
async def get_proposal(proposal_id: str) -> ChangeProposal:
    """Get a single proposal by ID."""
    proposal = governance_service.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail=f"Proposal {proposal_id} not found")
    return proposal


@router.post("/proposals", response_model=ChangeProposal)
async def create_proposal(request: ChangeProposalCreate) -> ChangeProposal:
    """Create a new change proposal."""
    return governance_service.create_proposal(request)


@router.patch("/proposals/{proposal_id}", response_model=ChangeProposal)
async def update_proposal(proposal_id: str, request: ChangeProposalUpdate) -> ChangeProposal:
    """Update a proposal (submit, approve, publish)."""
    proposal = governance_service.update_proposal(proposal_id, request)
    if not proposal:
        raise HTTPException(status_code=404, detail=f"Proposal {proposal_id} not found")
    return proposal
