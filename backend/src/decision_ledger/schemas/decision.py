"""Decision-related Pydantic models."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class DecisionStatus(str, Enum):
    """Status of a decision."""

    APPROVED = "Approved"
    PARTIAL = "Partial"
    DENIED = "Denied"


class PayoutItem(BaseModel):
    """A payout breakdown item."""

    item_id: str
    label: str
    covered_amount: float
    notes: str


class DecisionOutcome(BaseModel):
    """The outcome of a decision run."""

    approved: bool
    status: DecisionStatus
    payout_total: float
    payout_breakdown: list[PayoutItem]
    deductible_applied: float


class ResolvedAssumption(BaseModel):
    """A resolved assumption in a decision run."""

    assumption_id: str
    fact_id: str
    fact_label: str
    chosen_resolution: str
    chosen_by_role: str
    reason: str | None = None


class SelectedInterpretation(BaseModel):
    """A selected interpretation option in a decision run."""

    decision_point_id: str
    option: str


class TraceStep(BaseModel):
    """A step in the decision trace."""

    step_id: str
    step_number: int
    label: str
    description: str
    inputs_used: list[str]
    rule_refs: list[str]
    evidence_refs: list[str]
    output: str
    output_value: str | None = None


class DecisionRun(BaseModel):
    """A complete decision run (ledger event)."""

    run_id: str
    claim_id: str
    timestamp: datetime
    interpretation_set_id: str
    interpretation_set_version: str
    assumption_set_id: str
    assumption_set_version: str
    resolved_assumptions: list[ResolvedAssumption]
    selected_interpretations: list[SelectedInterpretation]
    outcome: DecisionOutcome
    trace_steps: list[TraceStep]
    generated_by_role: str


class DecisionRunRequest(BaseModel):
    """Request to run a decision."""

    claim_id: str
    interpretation_set_id: str
    assumption_set_id: str
    resolved_assumptions: list[ResolvedAssumption]
    selected_interpretations: list[SelectedInterpretation]
    role: str


class ChangeType(str, Enum):
    """Type of change for counterfactual."""

    ASSUMPTION = "ASSUMPTION"
    INTERPRETATION = "INTERPRETATION"


class TraceDiff(BaseModel):
    """Difference between two traces."""

    changed_step_id: str
    changed_step_number: int
    original_output: str
    new_output: str
    summary: str


class CounterfactualRun(BaseModel):
    """Result of a counterfactual simulation."""

    base_run_id: str
    change_type: ChangeType
    change_ref: str
    original_value: str
    new_value: str
    new_outcome: DecisionOutcome
    delta: float
    trace_diff: TraceDiff


class CounterfactualRequest(BaseModel):
    """Request for a counterfactual simulation."""

    base_run_id: str
    change_type: ChangeType
    change_ref: str
    original_value: str
    new_value: str
