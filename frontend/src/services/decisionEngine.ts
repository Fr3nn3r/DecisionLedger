import type {
  Claim,
  InterpretationSet,
  AssumptionSet,
  ResolvedAssumption,
  SelectedInterpretation,
  DecisionOutcome,
  TraceStep,
} from '@/types';
import { CH_MOTOR_DEDUCTIBLE } from '@/data';

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

/**
 * Runs the decision engine on the given input.
 *
 * Stub implementation: Returns a Denied outcome with placeholder trace.
 * Full logic will be implemented in S2.7b/c/d.
 */
export function runDecision(input: DecisionEngineInput): DecisionEngineOutput {
  const runId = generateRunId();
  const timestamp = new Date().toISOString();

  // Stub outcome: Denied with zero payout
  const outcome: DecisionOutcome = {
    approved: false,
    status: 'Denied',
    payout_total: 0,
    payout_breakdown: [],
    deductible_applied: CH_MOTOR_DEDUCTIBLE,
  };

  // Stub trace: Single placeholder step
  const traceSteps: TraceStep[] = [
    {
      step_id: 'STEP-001',
      step_number: 1,
      label: 'Initialize Decision',
      description: 'Stub implementation - full logic pending',
      inputs_used: [input.claim.claim_id],
      rule_refs: [],
      evidence_refs: [],
      output: 'DENIED',
      output_value: '0',
    },
  ];

  return {
    runId,
    timestamp,
    outcome,
    traceSteps,
  };
}
