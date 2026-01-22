"""Claims API routes."""

from fastapi import APIRouter, HTTPException

from decision_ledger.schemas.claim import Claim, ClaimSummary
from decision_ledger.api.services.claims_service import ClaimsService

router = APIRouter()
claims_service = ClaimsService()


@router.get("", response_model=list[ClaimSummary])
async def list_claims(
    jurisdiction: str | None = None,
    product_line: str | None = None,
    search: str | None = None,
) -> list[ClaimSummary]:
    """List all claims with optional filters."""
    return claims_service.list_claims(
        jurisdiction=jurisdiction,
        product_line=product_line,
        search=search,
    )


@router.get("/{claim_id}", response_model=Claim)
async def get_claim(claim_id: str) -> Claim:
    """Get a single claim by ID."""
    claim = claims_service.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    return claim
