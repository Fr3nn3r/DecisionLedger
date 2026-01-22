"""Claim-related Pydantic models."""

from datetime import date
from enum import Enum
from pydantic import BaseModel


class FactStatus(str, Enum):
    """Status of a fact."""

    KNOWN = "KNOWN"
    UNKNOWN = "UNKNOWN"


class Fact(BaseModel):
    """A fact about a claim."""

    fact_id: str
    label: str
    value: str | None
    status: FactStatus
    source: str


class Evidence(BaseModel):
    """Evidence document attached to a claim."""

    evidence_id: str
    label: str
    type: str
    url: str


class LineItem(BaseModel):
    """A line item on a claim."""

    item_id: str
    label: str
    amount_chf: float
    category: str


class ClaimStatus(str, Enum):
    """Status of a claim."""

    READY = "Ready"
    DECIDED = "Decided"


class ClaimSummary(BaseModel):
    """Summary view of a claim for list display."""

    claim_id: str
    jurisdiction: str
    product_line: str
    loss_date: date
    status: ClaimStatus


class Claim(BaseModel):
    """Full claim model with all details."""

    claim_id: str
    jurisdiction: str
    product_line: str
    loss_date: date
    policy_id: str
    status: ClaimStatus
    facts: list[Fact]
    evidence: list[Evidence]
    line_items: list[LineItem]
