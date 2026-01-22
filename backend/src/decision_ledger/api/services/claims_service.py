"""Claims business logic service."""

from decision_ledger.schemas.claim import Claim, ClaimSummary
from decision_ledger.storage.filesystem import FileStorage


class ClaimsService:
    """Service for managing claims data."""

    def __init__(self) -> None:
        self.storage = FileStorage()

    def list_claims(
        self,
        jurisdiction: str | None = None,
        product_line: str | None = None,
        search: str | None = None,
    ) -> list[ClaimSummary]:
        """List all claims with optional filters."""
        claims = self.storage.load_claims()

        # Apply filters
        if jurisdiction:
            claims = [c for c in claims if c.jurisdiction == jurisdiction]
        if product_line:
            claims = [c for c in claims if c.product_line == product_line]
        if search:
            search_lower = search.lower()
            claims = [c for c in claims if search_lower in c.claim_id.lower()]

        # Convert to summaries
        return [
            ClaimSummary(
                claim_id=c.claim_id,
                jurisdiction=c.jurisdiction,
                product_line=c.product_line,
                loss_date=c.loss_date,
                status=c.status,
            )
            for c in claims
        ]

    def get_claim(self, claim_id: str) -> Claim | None:
        """Get a single claim by ID."""
        claims = self.storage.load_claims()
        for claim in claims:
            if claim.claim_id == claim_id:
                return claim
        return None
