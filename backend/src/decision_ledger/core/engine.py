"""Deterministic decision engine for CH Motor claims."""

from decision_ledger.schemas.claim import Claim, FactStatus
from decision_ledger.schemas.catalog import InterpretationSet, AssumptionSet
from decision_ledger.schemas.decision import (
    DecisionOutcome,
    DecisionStatus,
    PayoutItem,
    TraceStep,
    ResolvedAssumption,
    SelectedInterpretation,
    TraceDiff,
)


class DecisionEngine:
    """Deterministic decision engine for insurance claims.

    This engine implements the CH Motor/Casco decision logic where:
    - Base repair is always covered
    - Tow bar coverage depends on:
      - ACCESSORY_COVERAGE interpretation
      - accessory_declared assumption (when fact is UNKNOWN)
    - Standard deductible of 500 CHF is applied
    """

    DEDUCTIBLE = 500.0

    def run(
        self,
        claim: Claim,
        interpretation_set: InterpretationSet | None,
        assumption_set: AssumptionSet | None,
        resolved_assumptions: list[ResolvedAssumption],
        selected_interpretations: list[SelectedInterpretation],
    ) -> tuple[DecisionOutcome, list[TraceStep]]:
        """Run the decision engine and return outcome with trace.

        Args:
            claim: The claim to process
            interpretation_set: Active interpretation set
            assumption_set: Active assumption set
            resolved_assumptions: User-resolved assumptions
            selected_interpretations: User-selected interpretations

        Returns:
            Tuple of (DecisionOutcome, list[TraceStep])
        """
        trace_steps: list[TraceStep] = []
        payout_items: list[PayoutItem] = []
        step_number = 0

        # Step 1: Identify line items
        step_number += 1
        trace_steps.append(
            TraceStep(
                step_id=f"STEP-{step_number}",
                step_number=step_number,
                label="Identify Line Items",
                description="Extract claimable line items from the claim",
                inputs_used=[f"claim.line_items ({len(claim.line_items)} items)"],
                rule_refs=["RULE.LINE_ITEM_EXTRACTION"],
                evidence_refs=[],
                output=f"Found {len(claim.line_items)} line items to evaluate",
            )
        )

        # Step 2: Check facts and identify unknowns
        step_number += 1
        unknown_facts = [f for f in claim.facts if f.status == FactStatus.UNKNOWN]
        trace_steps.append(
            TraceStep(
                step_id=f"STEP-{step_number}",
                step_number=step_number,
                label="Evaluate Facts",
                description="Check known vs unknown facts",
                inputs_used=[f"claim.facts ({len(claim.facts)} facts)"],
                rule_refs=["RULE.FACT_EVALUATION"],
                evidence_refs=[],
                output=f"Found {len(unknown_facts)} unknown facts requiring assumptions",
            )
        )

        # Step 3: Apply assumptions for unknown facts
        step_number += 1
        assumed_values: dict[str, str] = {}
        for ra in resolved_assumptions:
            assumed_values[ra.fact_id] = ra.chosen_resolution

        trace_steps.append(
            TraceStep(
                step_id=f"STEP-{step_number}",
                step_number=step_number,
                label="Apply Assumptions",
                description="Resolve unknown facts using governed assumptions",
                inputs_used=[f"resolved_assumptions ({len(resolved_assumptions)} resolutions)"],
                rule_refs=["RULE.ASSUMPTION_APPLICATION"],
                evidence_refs=[],
                output=f"Applied {len(resolved_assumptions)} assumption resolutions",
            )
        )

        # Step 4: Evaluate base repair coverage (always covered in demo)
        step_number += 1
        base_repair_items = [li for li in claim.line_items if li.category == "repair"]
        base_repair_total = sum(li.amount_chf for li in base_repair_items)

        for item in base_repair_items:
            payout_items.append(
                PayoutItem(
                    item_id=item.item_id,
                    label=item.label,
                    covered_amount=item.amount_chf,
                    notes="Base repair - covered under standard policy",
                )
            )

        trace_steps.append(
            TraceStep(
                step_id=f"STEP-{step_number}",
                step_number=step_number,
                label="Evaluate Base Repair Coverage",
                description="Assess standard repair items against policy coverage",
                inputs_used=["claim.line_items[category=repair]", "policy.base_coverage"],
                rule_refs=["RULE.BASE_REPAIR_COVERAGE", "DP.STANDARD_COVERAGE"],
                evidence_refs=["repair_estimate.pdf"],
                output=f"Base repair covered: CHF {base_repair_total:.2f}",
                output_value=str(base_repair_total),
            )
        )

        # Step 5: Evaluate accessory coverage (tow bar - key decision point)
        step_number += 1
        accessory_items = [li for li in claim.line_items if li.category == "accessory"]
        accessory_total = sum(li.amount_chf for li in accessory_items)

        # Get the ACCESSORY_COVERAGE interpretation
        accessory_interpretation = "INCLUDED_IF_DECLARED"  # default
        for si in selected_interpretations:
            if si.decision_point_id == "DP.ACCESSORY_COVERAGE":
                accessory_interpretation = si.option
                break

        # Get the accessory_declared assumption resolution
        accessory_declared = assumed_values.get("FACT.ACCESSORY_DECLARED", "NOT_DECLARED")

        # Determine coverage based on interpretation + assumption
        accessory_covered = False
        coverage_reason = ""

        if accessory_interpretation == "INCLUDED_BY_DEFAULT":
            accessory_covered = True
            coverage_reason = "Interpretation: accessories included by default"
        elif accessory_interpretation == "EXCLUDED":
            accessory_covered = False
            coverage_reason = "Interpretation: accessories excluded from coverage"
        elif accessory_interpretation == "INCLUDED_IF_DECLARED":
            if accessory_declared == "DECLARED":
                accessory_covered = True
                coverage_reason = "Accessory was declared (assumed) - covered"
            else:
                accessory_covered = False
                coverage_reason = "Accessory was not declared (assumed) - not covered"

        for item in accessory_items:
            if accessory_covered:
                payout_items.append(
                    PayoutItem(
                        item_id=item.item_id,
                        label=item.label,
                        covered_amount=item.amount_chf,
                        notes=coverage_reason,
                    )
                )
            else:
                payout_items.append(
                    PayoutItem(
                        item_id=item.item_id,
                        label=item.label,
                        covered_amount=0.0,
                        notes=coverage_reason,
                    )
                )

        covered_accessory_total = accessory_total if accessory_covered else 0.0

        trace_steps.append(
            TraceStep(
                step_id=f"STEP-{step_number}",
                step_number=step_number,
                label="Evaluate Accessory Coverage",
                description="Assess accessory items using interpretation and assumed facts",
                inputs_used=[
                    f"DP.ACCESSORY_COVERAGE = {accessory_interpretation}",
                    f"FACT.ACCESSORY_DECLARED = {accessory_declared} (assumed)",
                ],
                rule_refs=["RULE.ACCESSORY_COVERAGE", f"DP.ACCESSORY_COVERAGE.{accessory_interpretation}"],
                evidence_refs=["tow_bar_invoice.pdf"] if accessory_items else [],
                output=f"Accessory covered: {'Yes' if accessory_covered else 'No'} (CHF {covered_accessory_total:.2f})",
                output_value=str(covered_accessory_total),
            )
        )

        # Step 6: Apply deductible
        step_number += 1
        gross_payout = sum(pi.covered_amount for pi in payout_items)
        deductible = min(self.DEDUCTIBLE, gross_payout)
        net_payout = max(0, gross_payout - deductible)

        trace_steps.append(
            TraceStep(
                step_id=f"STEP-{step_number}",
                step_number=step_number,
                label="Apply Deductible",
                description="Subtract policy deductible from gross payout",
                inputs_used=[f"gross_payout = CHF {gross_payout:.2f}", f"deductible = CHF {deductible:.2f}"],
                rule_refs=["RULE.DEDUCTIBLE_APPLICATION"],
                evidence_refs=["policy_schedule.pdf"],
                output=f"Net payout after deductible: CHF {net_payout:.2f}",
                output_value=str(net_payout),
            )
        )

        # Step 7: Final decision
        step_number += 1
        if net_payout > 0:
            if net_payout >= gross_payout * 0.9:
                status = DecisionStatus.APPROVED
            else:
                status = DecisionStatus.PARTIAL
        else:
            status = DecisionStatus.DENIED

        trace_steps.append(
            TraceStep(
                step_id=f"STEP-{step_number}",
                step_number=step_number,
                label="Final Decision",
                description="Determine final claim status and payout",
                inputs_used=[f"net_payout = CHF {net_payout:.2f}"],
                rule_refs=["RULE.FINAL_DECISION"],
                evidence_refs=[],
                output=f"Decision: {status.value} - CHF {net_payout:.2f}",
                output_value=status.value,
            )
        )

        outcome = DecisionOutcome(
            approved=status != DecisionStatus.DENIED,
            status=status,
            payout_total=net_payout,
            payout_breakdown=payout_items,
            deductible_applied=deductible,
        )

        return outcome, trace_steps

    def diff_traces(
        self,
        original_trace: list[TraceStep],
        new_trace: list[TraceStep],
    ) -> TraceDiff:
        """Find the first step where traces differ.

        Args:
            original_trace: Trace from base run
            new_trace: Trace from counterfactual run

        Returns:
            TraceDiff describing where and how traces differ
        """
        for orig, new in zip(original_trace, new_trace):
            if orig.output != new.output:
                return TraceDiff(
                    changed_step_id=new.step_id,
                    changed_step_number=new.step_number,
                    original_output=orig.output,
                    new_output=new.output,
                    summary=f"Step {new.step_number} ({new.label}) produced different output",
                )

        # If no difference found in matching steps
        return TraceDiff(
            changed_step_id=new_trace[-1].step_id if new_trace else "STEP-0",
            changed_step_number=len(new_trace),
            original_output=original_trace[-1].output if original_trace else "",
            new_output=new_trace[-1].output if new_trace else "",
            summary="No significant differences in trace steps",
        )
