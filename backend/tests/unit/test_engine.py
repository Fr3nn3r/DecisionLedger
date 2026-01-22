"""Unit tests for the decision engine."""

import pytest

from decision_ledger.core.engine import DecisionEngine
from decision_ledger.schemas.claim import Claim
from decision_ledger.schemas.catalog import InterpretationSet, AssumptionSet
from decision_ledger.schemas.decision import (
    DecisionStatus,
    ResolvedAssumption,
    SelectedInterpretation,
)


class TestDecisionEngine:
    """Tests for DecisionEngine."""

    @pytest.fixture
    def engine(self) -> DecisionEngine:
        """Create engine instance."""
        return DecisionEngine()

    def test_run_with_accessory_not_declared(
        self,
        engine: DecisionEngine,
        sample_claim: Claim,
        sample_interpretation_set: InterpretationSet,
        sample_assumption_set: AssumptionSet,
    ):
        """Test decision with accessory assumed not declared."""
        resolved_assumptions = [
            ResolvedAssumption(
                assumption_id="ASM.ACCESSORY_DECLARED",
                fact_id="FACT.ACCESSORY_DECLARED",
                fact_label="Accessory Declared",
                chosen_resolution="NOT_DECLARED",
                chosen_by_role="Adjuster",
            )
        ]
        selected_interpretations = [
            SelectedInterpretation(
                decision_point_id="DP.ACCESSORY_COVERAGE",
                option="INCLUDED_IF_DECLARED",
            )
        ]

        outcome, trace_steps = engine.run(
            claim=sample_claim,
            interpretation_set=sample_interpretation_set,
            assumption_set=sample_assumption_set,
            resolved_assumptions=resolved_assumptions,
            selected_interpretations=selected_interpretations,
        )

        # Base repair (2500) covered, accessory (1200) not covered
        # Deductible: 500
        # Expected: 2500 - 500 = 2000
        assert outcome.payout_total == 2000.0
        assert outcome.status == DecisionStatus.APPROVED
        assert outcome.deductible_applied == 500.0
        assert len(trace_steps) == 7

    def test_run_with_accessory_declared(
        self,
        engine: DecisionEngine,
        sample_claim: Claim,
        sample_interpretation_set: InterpretationSet,
        sample_assumption_set: AssumptionSet,
    ):
        """Test decision with accessory assumed declared."""
        resolved_assumptions = [
            ResolvedAssumption(
                assumption_id="ASM.ACCESSORY_DECLARED",
                fact_id="FACT.ACCESSORY_DECLARED",
                fact_label="Accessory Declared",
                chosen_resolution="DECLARED",
                chosen_by_role="Supervisor",
            )
        ]
        selected_interpretations = [
            SelectedInterpretation(
                decision_point_id="DP.ACCESSORY_COVERAGE",
                option="INCLUDED_IF_DECLARED",
            )
        ]

        outcome, trace_steps = engine.run(
            claim=sample_claim,
            interpretation_set=sample_interpretation_set,
            assumption_set=sample_assumption_set,
            resolved_assumptions=resolved_assumptions,
            selected_interpretations=selected_interpretations,
        )

        # Base repair (2500) + accessory (1200) = 3700
        # Deductible: 500
        # Expected: 3700 - 500 = 3200
        assert outcome.payout_total == 3200.0
        assert outcome.status == DecisionStatus.APPROVED
        assert len(outcome.payout_breakdown) == 2

    def test_run_with_excluded_interpretation(
        self,
        engine: DecisionEngine,
        sample_claim: Claim,
        sample_interpretation_set: InterpretationSet,
        sample_assumption_set: AssumptionSet,
    ):
        """Test decision with accessories excluded by interpretation."""
        resolved_assumptions = [
            ResolvedAssumption(
                assumption_id="ASM.ACCESSORY_DECLARED",
                fact_id="FACT.ACCESSORY_DECLARED",
                fact_label="Accessory Declared",
                chosen_resolution="DECLARED",  # Even if declared
                chosen_by_role="Supervisor",
            )
        ]
        selected_interpretations = [
            SelectedInterpretation(
                decision_point_id="DP.ACCESSORY_COVERAGE",
                option="EXCLUDED",  # Interpretation excludes accessories
            )
        ]

        outcome, trace_steps = engine.run(
            claim=sample_claim,
            interpretation_set=sample_interpretation_set,
            assumption_set=sample_assumption_set,
            resolved_assumptions=resolved_assumptions,
            selected_interpretations=selected_interpretations,
        )

        # Accessory excluded by interpretation regardless of declaration
        # Expected: 2500 - 500 = 2000
        assert outcome.payout_total == 2000.0

    def test_deterministic_output(
        self,
        engine: DecisionEngine,
        sample_claim: Claim,
        sample_interpretation_set: InterpretationSet,
        sample_assumption_set: AssumptionSet,
    ):
        """Test that same inputs produce same outputs."""
        resolved_assumptions = [
            ResolvedAssumption(
                assumption_id="ASM.ACCESSORY_DECLARED",
                fact_id="FACT.ACCESSORY_DECLARED",
                fact_label="Accessory Declared",
                chosen_resolution="DECLARED",
                chosen_by_role="Supervisor",
            )
        ]
        selected_interpretations = [
            SelectedInterpretation(
                decision_point_id="DP.ACCESSORY_COVERAGE",
                option="INCLUDED_IF_DECLARED",
            )
        ]

        # Run twice
        outcome1, trace1 = engine.run(
            claim=sample_claim,
            interpretation_set=sample_interpretation_set,
            assumption_set=sample_assumption_set,
            resolved_assumptions=resolved_assumptions,
            selected_interpretations=selected_interpretations,
        )

        outcome2, trace2 = engine.run(
            claim=sample_claim,
            interpretation_set=sample_interpretation_set,
            assumption_set=sample_assumption_set,
            resolved_assumptions=resolved_assumptions,
            selected_interpretations=selected_interpretations,
        )

        # Outputs must be identical
        assert outcome1.payout_total == outcome2.payout_total
        assert outcome1.status == outcome2.status
        assert len(trace1) == len(trace2)
        for s1, s2 in zip(trace1, trace2):
            assert s1.output == s2.output

    def test_diff_traces_finds_difference(
        self,
        engine: DecisionEngine,
        sample_claim: Claim,
        sample_interpretation_set: InterpretationSet,
        sample_assumption_set: AssumptionSet,
    ):
        """Test that trace diff identifies changed step."""
        # Run 1: Not declared
        resolved1 = [
            ResolvedAssumption(
                assumption_id="ASM.ACCESSORY_DECLARED",
                fact_id="FACT.ACCESSORY_DECLARED",
                fact_label="Accessory Declared",
                chosen_resolution="NOT_DECLARED",
                chosen_by_role="Adjuster",
            )
        ]
        selected = [
            SelectedInterpretation(
                decision_point_id="DP.ACCESSORY_COVERAGE",
                option="INCLUDED_IF_DECLARED",
            )
        ]

        _, trace1 = engine.run(
            claim=sample_claim,
            interpretation_set=sample_interpretation_set,
            assumption_set=sample_assumption_set,
            resolved_assumptions=resolved1,
            selected_interpretations=selected,
        )

        # Run 2: Declared
        resolved2 = [
            ResolvedAssumption(
                assumption_id="ASM.ACCESSORY_DECLARED",
                fact_id="FACT.ACCESSORY_DECLARED",
                fact_label="Accessory Declared",
                chosen_resolution="DECLARED",
                chosen_by_role="Supervisor",
            )
        ]

        _, trace2 = engine.run(
            claim=sample_claim,
            interpretation_set=sample_interpretation_set,
            assumption_set=sample_assumption_set,
            resolved_assumptions=resolved2,
            selected_interpretations=selected,
        )

        diff = engine.diff_traces(trace1, trace2)

        # Should find difference at step 5 (Evaluate Accessory Coverage)
        assert diff.changed_step_number == 5
        assert "Accessory" in diff.summary
