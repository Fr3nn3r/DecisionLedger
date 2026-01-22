"""Governance-related Pydantic models."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class ProposalStatus(str, Enum):
    """Status of a change proposal."""

    DRAFT = "Draft"
    PENDING_APPROVAL = "Pending Approval"
    APPROVED = "Approved"
    PUBLISHED = "Published"
    REJECTED = "Rejected"


class ProposalType(str, Enum):
    """Type of change proposal."""

    ASSUMPTION = "Assumption"
    INTERPRETATION = "Interpretation"


class QAImpactSummary(BaseModel):
    """Summary of QA impact for a proposal."""

    cohort_id: str
    cohort_label: str
    impacted_claims_count: int
    total_delta_payout: float


class ApprovalStep(BaseModel):
    """An approval step in the workflow."""

    step_name: str
    required_role: str
    status: str
    completed_at: datetime | None = None
    completed_by: str | None = None


class ChangeProposal(BaseModel):
    """A change proposal for governance."""

    proposal_id: str
    title: str
    proposal_type: ProposalType
    proposed_version: str
    rationale: str
    qa_impact_summary: QAImpactSummary | None = None
    status: ProposalStatus
    created_at: datetime
    created_by: str
    approved_at: datetime | None = None
    approved_by: str | None = None
    published_at: datetime | None = None
    approval_steps: list[ApprovalStep] = []


class ChangeProposalCreate(BaseModel):
    """Request to create a change proposal."""

    title: str
    proposal_type: ProposalType
    proposed_version: str
    rationale: str
    qa_impact_summary: QAImpactSummary | None = None
    created_by: str


class ChangeProposalUpdate(BaseModel):
    """Request to update a change proposal."""

    action: str  # "submit", "approve", "publish", "reject"
    actor_role: str
