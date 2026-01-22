import type {
  Claim,
  InterpretationSet,
  AssumptionSet,
  ResolvedAssumption,
  SelectedInterpretation,
  DecisionOutcome,
  DecisionStatus,
  TraceStep,
  PayoutItem,
  LineItem,
} from '@/types';
import { CH_MOTOR_DEDUCTIBLE } from '@/data';

// Line item categories
const CATEGORY_REPAIR = 'repair';
const CATEGORY_ACCESSORY = 'accessory';

/**
 * Input to the decision engine
 */
export interface DecisionEngineInput {
  claim: Claim;
  interpretationSet: InterpretationSet;
  assumptionSet: AssumptionSet;
  resolvedAssumptions: ResolvedAssumption[];
  selectedInterpretations: SelectedInterpretation[];
}

/**
 * Output from the decision engine
 */
export interface DecisionEngineOutput {
  runId: string;
  timestamp: string;
  outcome: DecisionOutcome;
  traceSteps: TraceStep[];
}

/**
 * Generates a unique run ID in the format RUN-{timestamp}-{random}
 */
export function generateRunId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `RUN-${timestamp}-${random}`;
}

// Interpretation decision point IDs
const DP_ACCESSORY_COVERAGE = 'DP.ACCESSORY_COVERAGE';

// Interpretation options for accessory coverage
const OPTION_INCLUDED_IF_DECLARED = 'INCLUDED_IF_DECLARED';
const OPTION_INCLUDED_BY_DEFAULT = 'INCLUDED_BY_DEFAULT';
const OPTION_EXCLUDED = 'EXCLUDED';

// Assumption IDs
const ASM_ACCESSORY_DECLARED = 'ASM.ACCESSORY_DECLARED';

// Assumption resolution values
const RESOLUTION_DECLARED = 'DECLARED';
const RESOLUTION_NOT_DECLARED = 'NOT_DECLARED';

/**
 * Gets the selected option for a decision point, returning the option ID or undefined.
 */
function getSelectedInterpretation(
  decisionPointId: string,
  selectedInterpretations: SelectedInterpretation[]
): string | undefined {
  const selected = selectedInterpretations.find((i) => i.decision_point_id === decisionPointId);
  return selected?.option;
}

/**
 * Gets the resolved value for an assumption, returning the resolution or undefined.
 */
function getResolvedAssumption(
  assumptionId: string,
  resolvedAssumptions: ResolvedAssumption[]
): string | undefined {
  const resolved = resolvedAssumptions.find((a) => a.assumption_id === assumptionId);
  return resolved?.chosen_resolution;
}

/**
 * Determines if an accessory item is covered based on interpretation and assumption rules.
 *
 * Coverage matrix:
 * - INCLUDED_BY_DEFAULT: Always covered (regardless of assumption)
 * - EXCLUDED: Never covered (regardless of assumption)
 * - INCLUDED_IF_DECLARED + DECLARED: Covered
 * - INCLUDED_IF_DECLARED + NOT_DECLARED: Not covered
 */
function isAccessoryCovered(
  selectedInterpretations: SelectedInterpretation[],
  resolvedAssumptions: ResolvedAssumption[]
): { covered: boolean; reason: string } {
  const accessoryCoverageOption = getSelectedInterpretation(DP_ACCESSORY_COVERAGE, selectedInterpretations);
  const accessoryDeclaredResolution = getResolvedAssumption(ASM_ACCESSORY_DECLARED, resolvedAssumptions);

  // Handle each interpretation option
  switch (accessoryCoverageOption) {
    case OPTION_INCLUDED_BY_DEFAULT:
      return { covered: true, reason: 'Accessory included by default policy' };

    case OPTION_EXCLUDED:
      return { covered: false, reason: 'Accessory excluded by policy' };

    case OPTION_INCLUDED_IF_DECLARED:
      // Depends on the resolved assumption
      if (accessoryDeclaredResolution === RESOLUTION_DECLARED) {
        return { covered: true, reason: 'Accessory declared and covered' };
      } else if (accessoryDeclaredResolution === RESOLUTION_NOT_DECLARED) {
        return { covered: false, reason: 'Accessory not declared, excluded from coverage' };
      }
      // No resolved assumption - fallback to not covered
      return { covered: false, reason: 'Accessory declaration status unresolved' };

    default:
      // No interpretation selected - fallback to not covered
      return { covered: false, reason: 'No accessory coverage policy selected' };
  }
}

/**
 * Determines if a line item is covered based on category and interpretation/assumption rules.
 *
 * - 'repair' items are always covered (base coverage)
 * - 'accessory' items depend on interpretation and resolved assumptions
 */
function isItemCovered(
  item: LineItem,
  selectedInterpretations: SelectedInterpretation[],
  resolvedAssumptions: ResolvedAssumption[]
): { covered: boolean; reason: string } {
  // Base coverage: repair items are always covered
  if (item.category === CATEGORY_REPAIR) {
    return { covered: true, reason: 'Base repair coverage' };
  }

  // Accessory coverage: depends on interpretation and assumption
  if (item.category === CATEGORY_ACCESSORY) {
    return isAccessoryCovered(selectedInterpretations, resolvedAssumptions);
  }

  // Unknown category - not covered
  return { covered: false, reason: 'Unknown item category' };
}

/**
 * Calculates the payout for covered items and applies the deductible.
 */
function calculatePayout(
  lineItems: LineItem[],
  selectedInterpretations: SelectedInterpretation[],
  resolvedAssumptions: ResolvedAssumption[]
): { payoutBreakdown: PayoutItem[]; grossTotal: number; netTotal: number } {
  const payoutBreakdown: PayoutItem[] = [];
  let grossTotal = 0;

  for (const item of lineItems) {
    const { covered, reason } = isItemCovered(item, selectedInterpretations, resolvedAssumptions);

    if (covered) {
      payoutBreakdown.push({
        item_id: item.item_id,
        label: item.label,
        covered_amount: item.amount_chf,
        notes: reason,
      });
      grossTotal += item.amount_chf;
    }
  }

  // Apply deductible (payout cannot be negative)
  const netTotal = Math.max(0, grossTotal - CH_MOTOR_DEDUCTIBLE);

  return { payoutBreakdown, grossTotal, netTotal };
}

/**
 * Determines the decision status based on payout and covered items.
 */
function determineStatus(netPayout: number, coveredCount: number, totalCount: number): DecisionStatus {
  if (netPayout <= 0 || coveredCount === 0) {
    return 'Denied';
  }
  if (coveredCount < totalCount) {
    return 'Partial';
  }
  return 'Approved';
}

/**
 * Generates comprehensive trace steps capturing the decision flow.
 */
function generateTraceSteps(
  claim: Claim,
  selectedInterpretations: SelectedInterpretation[],
  resolvedAssumptions: ResolvedAssumption[],
  payoutBreakdown: PayoutItem[],
  grossTotal: number,
  netTotal: number,
  status: DecisionStatus
): TraceStep[] {
  const traceSteps: TraceStep[] = [];
  let stepNumber = 0;

  // Step 1: Evaluate claim facts
  const unknownFacts = claim.facts.filter((f) => f.status === 'UNKNOWN');
  const knownFacts = claim.facts.filter((f) => f.status === 'KNOWN');
  stepNumber++;
  traceSteps.push({
    step_id: `STEP-${String(stepNumber).padStart(3, '0')}`,
    step_number: stepNumber,
    label: 'Evaluate Claim Facts',
    description: `Evaluated ${claim.facts.length} facts: ${knownFacts.length} known, ${unknownFacts.length} unknown`,
    inputs_used: claim.facts.map((f) => f.fact_id),
    rule_refs: ['RULE.FACT_EVALUATION'],
    evidence_refs: claim.evidence.map((e) => e.evidence_id),
    output: unknownFacts.length > 0
      ? `Unknown facts require assumption resolution: ${unknownFacts.map((f) => f.label).join(', ')}`
      : 'All facts known - no assumptions required',
    output_value: String(unknownFacts.length),
  });

  // Step 2: Apply resolved assumptions (if any)
  if (resolvedAssumptions.length > 0) {
    for (const assumption of resolvedAssumptions) {
      stepNumber++;
      traceSteps.push({
        step_id: `STEP-${String(stepNumber).padStart(3, '0')}`,
        step_number: stepNumber,
        label: `Apply Assumption: ${assumption.fact_label}`,
        description: `Resolved unknown fact "${assumption.fact_label}" using assumption ${assumption.assumption_id}`,
        inputs_used: [assumption.assumption_id, assumption.fact_id],
        rule_refs: [`RULE.ASSUMPTION.${assumption.assumption_id}`],
        evidence_refs: [],
        output: `Assumed value: ${assumption.chosen_resolution} (chosen by ${assumption.chosen_by_role})`,
        output_value: assumption.chosen_resolution,
      });
    }
  }

  // Step 3: Apply interpretation (if accessory coverage interpretation is selected)
  const accessoryCoverageOption = getSelectedInterpretation(DP_ACCESSORY_COVERAGE, selectedInterpretations);
  if (accessoryCoverageOption) {
    stepNumber++;
    let interpretationOutput = '';
    switch (accessoryCoverageOption) {
      case OPTION_INCLUDED_BY_DEFAULT:
        interpretationOutput = 'Accessories always covered under default policy';
        break;
      case OPTION_EXCLUDED:
        interpretationOutput = 'Accessories excluded from coverage';
        break;
      case OPTION_INCLUDED_IF_DECLARED:
        interpretationOutput = 'Accessories covered only if declared on policy';
        break;
      default:
        interpretationOutput = `Policy option: ${accessoryCoverageOption}`;
    }
    traceSteps.push({
      step_id: `STEP-${String(stepNumber).padStart(3, '0')}`,
      step_number: stepNumber,
      label: 'Apply Accessory Coverage Policy',
      description: `Applied interpretation ${DP_ACCESSORY_COVERAGE} with option ${accessoryCoverageOption}`,
      inputs_used: [DP_ACCESSORY_COVERAGE],
      rule_refs: [`RULE.INTERPRETATION.${DP_ACCESSORY_COVERAGE}`],
      evidence_refs: [],
      output: interpretationOutput,
      output_value: accessoryCoverageOption,
    });
  }

  // Step 4: Evaluate each line item for coverage
  const hasAccessoryItems = claim.line_items.some((item) => item.category === CATEGORY_ACCESSORY);
  stepNumber++;
  const itemResults = claim.line_items.map((item) => {
    const { covered, reason } = isItemCovered(item, selectedInterpretations, resolvedAssumptions);
    return { item, covered, reason };
  });
  const coveredItems = itemResults.filter((r) => r.covered);
  const excludedItems = itemResults.filter((r) => !r.covered);

  traceSteps.push({
    step_id: `STEP-${String(stepNumber).padStart(3, '0')}`,
    step_number: stepNumber,
    label: 'Evaluate Line Item Coverage',
    description: `Evaluated ${claim.line_items.length} line items against coverage rules`,
    inputs_used: claim.line_items.map((item) => item.item_id),
    rule_refs: hasAccessoryItems
      ? ['RULE.BASE_COVERAGE', `RULE.INTERPRETATION.${DP_ACCESSORY_COVERAGE}`]
      : ['RULE.BASE_COVERAGE'],
    evidence_refs: [],
    output: `${coveredItems.length}/${claim.line_items.length} items covered` +
      (excludedItems.length > 0 ? `. Excluded: ${excludedItems.map((r) => r.item.label).join(', ')}` : ''),
    output_value: String(coveredItems.length),
  });

  // Step 5: Calculate gross payout
  stepNumber++;
  traceSteps.push({
    step_id: `STEP-${String(stepNumber).padStart(3, '0')}`,
    step_number: stepNumber,
    label: 'Calculate Gross Payout',
    description: 'Sum of all covered item amounts',
    inputs_used: payoutBreakdown.map((item) => item.item_id),
    rule_refs: ['RULE.PAYOUT_CALCULATION'],
    evidence_refs: [],
    output: `Gross payout: CHF ${grossTotal.toLocaleString('de-CH')}`,
    output_value: String(grossTotal),
  });

  // Step 6: Apply deductible
  stepNumber++;
  traceSteps.push({
    step_id: `STEP-${String(stepNumber).padStart(3, '0')}`,
    step_number: stepNumber,
    label: 'Apply Deductible',
    description: `Applied standard CH Motor deductible of CHF ${CH_MOTOR_DEDUCTIBLE}`,
    inputs_used: ['DEDUCTIBLE.CH_MOTOR'],
    rule_refs: ['RULE.DEDUCTIBLE'],
    evidence_refs: [],
    output: `Net payout: CHF ${netTotal.toLocaleString('de-CH')} (gross ${grossTotal.toLocaleString('de-CH')} - deductible ${CH_MOTOR_DEDUCTIBLE})`,
    output_value: String(netTotal),
  });

  // Step 7: Determine final outcome
  stepNumber++;
  let outcomeDescription = '';
  switch (status) {
    case 'Approved':
      outcomeDescription = 'All line items covered, claim fully approved';
      break;
    case 'Partial':
      outcomeDescription = 'Some line items excluded, claim partially approved';
      break;
    case 'Denied':
      outcomeDescription = netTotal <= 0
        ? 'Payout does not exceed deductible, claim denied'
        : 'No items covered, claim denied';
      break;
  }
  traceSteps.push({
    step_id: `STEP-${String(stepNumber).padStart(3, '0')}`,
    step_number: stepNumber,
    label: 'Determine Final Outcome',
    description: outcomeDescription,
    inputs_used: [],
    rule_refs: ['RULE.OUTCOME_DETERMINATION'],
    evidence_refs: [],
    output: `Decision: ${status} - Payout: CHF ${netTotal.toLocaleString('de-CH')}`,
    output_value: status,
  });

  return traceSteps;
}

/**
 * Runs the decision engine on the given input.
 *
 * Decision logic:
 * 1. Evaluate claim facts (identify UNKNOWN facts)
 * 2. Apply resolved assumptions for UNKNOWN facts
 * 3. Apply interpretation rules (e.g., accessory coverage policy)
 * 4. Evaluate each line item for coverage based on category and rules
 * 5. Calculate gross payout (sum of covered items)
 * 6. Apply deductible (500 CHF for CH Motor)
 * 7. Determine outcome status (Approved/Partial/Denied)
 */
export function runDecision(input: DecisionEngineInput): DecisionEngineOutput {
  const runId = generateRunId();
  const timestamp = new Date().toISOString();
  const { claim, selectedInterpretations, resolvedAssumptions } = input;

  // Calculate payout
  const { payoutBreakdown, grossTotal, netTotal } = calculatePayout(
    claim.line_items,
    selectedInterpretations,
    resolvedAssumptions
  );

  // Determine status
  const coveredCount = payoutBreakdown.length;
  const totalCount = claim.line_items.length;
  const status = determineStatus(netTotal, coveredCount, totalCount);

  // Build outcome
  const outcome: DecisionOutcome = {
    approved: status === 'Approved',
    status,
    payout_total: netTotal,
    payout_breakdown: payoutBreakdown,
    deductible_applied: CH_MOTOR_DEDUCTIBLE,
  };

  // Generate comprehensive trace steps
  const traceSteps = generateTraceSteps(
    claim,
    selectedInterpretations,
    resolvedAssumptions,
    payoutBreakdown,
    grossTotal,
    netTotal,
    status
  );

  return {
    runId,
    timestamp,
    outcome,
    traceSteps,
  };
}
