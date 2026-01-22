"""Governance business logic service."""

from datetime import datetime
import uuid

from decision_ledger.schemas.governance import (
    ChangeProposal,
    ChangeProposalCreate,
    ChangeProposalUpdate,
    ProposalStatus,
)


class GovernanceService:
    """Service for managing change proposals."""

    def __init__(self) -> None:
        self._proposals: dict[str, ChangeProposal] = {}

    def list_proposals(self) -> list[ChangeProposal]:
        """List all change proposals."""
        return sorted(
            self._proposals.values(),
            key=lambda p: p.created_at,
            reverse=True,
        )

    def get_proposal(self, proposal_id: str) -> ChangeProposal | None:
        """Get a single proposal by ID."""
        return self._proposals.get(proposal_id)

    def create_proposal(self, request: ChangeProposalCreate) -> ChangeProposal:
        """Create a new change proposal."""
        proposal = ChangeProposal(
            proposal_id=f"PROP-{uuid.uuid4().hex[:8].upper()}",
            title=request.title,
            proposal_type=request.proposal_type,
            proposed_version=request.proposed_version,
            rationale=request.rationale,
            qa_impact_summary=request.qa_impact_summary,
            status=ProposalStatus.DRAFT,
            created_at=datetime.now(),
            created_by=request.created_by,
        )
        self._proposals[proposal.proposal_id] = proposal
        return proposal

    def update_proposal(
        self, proposal_id: str, request: ChangeProposalUpdate
    ) -> ChangeProposal | None:
        """Update a proposal status."""
        proposal = self._proposals.get(proposal_id)
        if not proposal:
            return None

        if request.action == "submit":
            proposal.status = ProposalStatus.PENDING_APPROVAL
        elif request.action == "approve":
            proposal.status = ProposalStatus.APPROVED
            proposal.approved_at = datetime.now()
            proposal.approved_by = request.actor_role
        elif request.action == "publish":
            proposal.status = ProposalStatus.PUBLISHED
            proposal.published_at = datetime.now()
            # TODO: Update active interpretation/assumption sets

        return proposal
