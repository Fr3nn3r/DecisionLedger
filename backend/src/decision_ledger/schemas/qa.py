"""QA Impact-related Pydantic models."""

from enum import Enum
from pydantic import BaseModel


class QAFlag(str, Enum):
    """Flags for QA study results."""

    INCONSISTENCY_DETECTED = "INCONSISTENCY_DETECTED"
    HIGH_IMPACT = "HIGH_IMPACT"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"


class ImpactedClaim(BaseModel):
    """A claim impacted by a proposed change."""

    claim_id: str
    delta: float


class QACohort(BaseModel):
    """A cohort for QA simulation."""

    cohort_id: str
    label: str
    description: str
    claim_count: int


class QAProposedChange(BaseModel):
    """A proposed change for QA simulation."""

    proposal_id: str
    label: str
    description: str
    change_type: str


class QAStudyResult(BaseModel):
    """Result of a QA impact study."""

    cohort_id: str
    cohort_label: str
    proposal_id: str
    proposal_label: str
    impacted_claims_count: int
    total_delta_payout: float
    top_impacted_claims: list[ImpactedClaim]
    flags: list[QAFlag] = []
