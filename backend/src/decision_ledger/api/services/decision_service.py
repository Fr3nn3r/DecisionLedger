"""Decision execution business logic service."""

from datetime import datetime
import uuid

from decision_ledger.schemas.decision import (
    DecisionRun,
    DecisionRunRequest,
    CounterfactualRequest,
    CounterfactualRun,
)
from decision_ledger.core.engine import DecisionEngine
from decision_ledger.storage.filesystem import FileStorage


class DecisionService:
    """Service for executing decisions and counterfactuals."""

    def __init__(self) -> None:
        self.storage = FileStorage()
        self.engine = DecisionEngine()
        self._runs: dict[str, DecisionRun] = {}

    def list_runs(self, claim_id: str | None = None) -> list[DecisionRun]:
        """List all decision runs, optionally filtered by claim."""
        runs = list(self._runs.values())
        if claim_id:
            runs = [r for r in runs if r.claim_id == claim_id]
        return sorted(runs, key=lambda r: r.timestamp, reverse=True)

    def get_run(self, run_id: str) -> DecisionRun | None:
        """Get a single decision run by ID."""
        return self._runs.get(run_id)

    def run_decision(self, request: DecisionRunRequest) -> DecisionRun:
        """Execute a decision run for a claim."""
        # Get claim data
        claim = self.storage.get_claim(request.claim_id)
        if not claim:
            raise ValueError(f"Claim {request.claim_id} not found")

        # Get interpretation and assumption sets
        interpretation_set = self.storage.get_interpretation_set(request.interpretation_set_id)
        assumption_set = self.storage.get_assumption_set(request.assumption_set_id)

        # Run the decision engine
        outcome, trace_steps = self.engine.run(
            claim=claim,
            interpretation_set=interpretation_set,
            assumption_set=assumption_set,
            resolved_assumptions=request.resolved_assumptions,
            selected_interpretations=request.selected_interpretations,
        )

        # Create the decision run
        run = DecisionRun(
            run_id=f"RUN-{uuid.uuid4().hex[:8].upper()}",
            claim_id=request.claim_id,
            timestamp=datetime.now(),
            interpretation_set_id=request.interpretation_set_id,
            interpretation_set_version=interpretation_set.version if interpretation_set else "unknown",
            assumption_set_id=request.assumption_set_id,
            assumption_set_version=assumption_set.version if assumption_set else "unknown",
            resolved_assumptions=request.resolved_assumptions,
            selected_interpretations=request.selected_interpretations,
            outcome=outcome,
            trace_steps=trace_steps,
            generated_by_role=request.role,
        )

        # Store the run
        self._runs[run.run_id] = run
        return run

    def run_counterfactual(self, request: CounterfactualRequest) -> CounterfactualRun:
        """Execute a counterfactual simulation."""
        base_run = self.get_run(request.base_run_id)
        if not base_run:
            raise ValueError(f"Base run {request.base_run_id} not found")

        # Get claim data
        claim = self.storage.get_claim(base_run.claim_id)

        # Get interpretation and assumption sets
        interpretation_set = self.storage.get_interpretation_set(base_run.interpretation_set_id)
        assumption_set = self.storage.get_assumption_set(base_run.assumption_set_id)

        # Apply the change to create modified inputs
        resolved_assumptions = list(base_run.resolved_assumptions)
        selected_interpretations = list(base_run.selected_interpretations)

        if request.change_type == "ASSUMPTION":
            # Modify the specific assumption resolution
            for i, ra in enumerate(resolved_assumptions):
                if ra.assumption_id == request.change_ref:
                    resolved_assumptions[i] = ra.model_copy(
                        update={"chosen_resolution": request.new_value}
                    )
                    break
        else:  # INTERPRETATION
            # Modify the specific interpretation selection
            for i, si in enumerate(selected_interpretations):
                if si.decision_point_id == request.change_ref:
                    selected_interpretations[i] = si.model_copy(
                        update={"option": request.new_value}
                    )
                    break

        # Run the engine with modified inputs
        new_outcome, new_trace = self.engine.run(
            claim=claim,
            interpretation_set=interpretation_set,
            assumption_set=assumption_set,
            resolved_assumptions=resolved_assumptions,
            selected_interpretations=selected_interpretations,
        )

        # Calculate delta
        delta = new_outcome.payout_total - base_run.outcome.payout_total

        # Find which trace step changed
        trace_diff = self.engine.diff_traces(base_run.trace_steps, new_trace)

        return CounterfactualRun(
            base_run_id=request.base_run_id,
            change_type=request.change_type,
            change_ref=request.change_ref,
            original_value=request.original_value,
            new_value=request.new_value,
            new_outcome=new_outcome,
            delta=delta,
            trace_diff=trace_diff,
        )
