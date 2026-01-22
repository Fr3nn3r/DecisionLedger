import { describe, it, expect } from 'vitest';
import {
  generateRunId,
  runDecision,
  type DecisionEngineInput,
  type DecisionEngineOutput,
} from '../decisionEngine';
import type { Claim, InterpretationSet, AssumptionSet } from '@/types';

// Test fixtures
const mockClaim: Claim = {
  claim_id: 'CLM-TEST-001',
  jurisdiction: 'CH',
  product_line: 'Motor/Casco',
  loss_date: '2025-12-15',
  policy_id: 'POL-TEST-001',
  status: 'Ready',
  facts: [
    {
      fact_id: 'FACT.ACCESSORY_DECLARED',
      label: 'Accessory Declared',
      value: null,
      status: 'UNKNOWN',
      source: 'Policy Document',
    },
  ],
  evidence: [],
  line_items: [
    { item_id: 'LI-001', label: 'Rear bumper repair', amount_chf: 2500, category: 'repair' },
    { item_id: 'LI-002', label: 'Tow bar replacement', amount_chf: 1200, category: 'accessory' },
  ],
};

const mockInterpretationSet: InterpretationSet = {
  interpretation_set_id: 'INT-TEST-001',
  jurisdiction: 'CH',
  product_line: 'Motor/Casco',
  effective_from: '2025-01-01',
  version: '2025.1',
  status: 'Approved',
  decision_points: [
    {
      decision_point_id: 'DP.ACCESSORY_COVERAGE',
      label: 'Accessory Coverage Policy',
      description: 'Determines how aftermarket accessories are treated',
      options: [
        { option_id: 'INCLUDED_IF_DECLARED', label: 'Included If Declared', description: 'Cover if declared' },
        { option_id: 'EXCLUDED', label: 'Excluded', description: 'Never cover' },
      ],
      default_option: 'INCLUDED_IF_DECLARED',
      owner: 'Policy Owner',
      status: 'Approved',
    },
  ],
};

const mockAssumptionSet: AssumptionSet = {
  assumption_set_id: 'ASM-TEST-001',
  jurisdiction: 'CH',
  product_line: 'Motor/Casco',
  version: '2025.1',
  status: 'Approved',
  assumptions: [
    {
      assumption_id: 'ASM.ACCESSORY_DECLARED',
      label: 'Accessory Declaration Status',
      trigger: 'FACT.ACCESSORY_DECLARED is UNKNOWN',
      trigger_fact_id: 'FACT.ACCESSORY_DECLARED',
      description: 'Default treatment when accessory declaration is unknown',
      recommended_resolution: 'NOT_DECLARED',
      alternatives: [
        { alternative_id: 'NOT_DECLARED', label: 'Not Declared', description: 'Conservative', allowed_roles: ['Adjuster'] },
        { alternative_id: 'DECLARED', label: 'Declared', description: 'Customer-favorable', allowed_roles: ['Supervisor'] },
      ],
      risk_tier: 'Medium',
    },
  ],
};

const createTestInput = (): DecisionEngineInput => ({
  claim: mockClaim,
  interpretationSet: mockInterpretationSet,
  assumptionSet: mockAssumptionSet,
  resolvedAssumptions: [
    {
      assumption_id: 'ASM.ACCESSORY_DECLARED',
      fact_id: 'FACT.ACCESSORY_DECLARED',
      fact_label: 'Accessory Declared',
      chosen_resolution: 'NOT_DECLARED',
      chosen_by_role: 'Adjuster',
    },
  ],
  selectedInterpretations: [
    { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_IF_DECLARED' },
  ],
});

describe('generateRunId', () => {
  it('generates IDs matching RUN-{timestamp}-{random} format', () => {
    const runId = generateRunId();
    expect(runId).toMatch(/^RUN-\d+-[a-z0-9]+$/);
  });

  it('generates unique IDs on consecutive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRunId());
    }
    expect(ids.size).toBe(100);
  });

  it('includes timestamp component', () => {
    const before = Date.now();
    const runId = generateRunId();
    const after = Date.now();

    const timestampStr = runId.split('-')[1];
    const timestamp = parseInt(timestampStr, 10);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('runDecision', () => {
  describe('return type validation', () => {
    it('returns a valid DecisionEngineOutput structure', () => {
      const input = createTestInput();
      const output = runDecision(input);

      // Check all required fields exist
      expect(output).toHaveProperty('runId');
      expect(output).toHaveProperty('timestamp');
      expect(output).toHaveProperty('outcome');
      expect(output).toHaveProperty('traceSteps');
    });

    it('returns a runId matching expected format', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(output.runId).toMatch(/^RUN-\d+-[a-z0-9]+$/);
    });

    it('returns a valid ISO timestamp', () => {
      const input = createTestInput();
      const output = runDecision(input);

      const date = new Date(output.timestamp);
      expect(date.toISOString()).toBe(output.timestamp);
    });

    it('returns a valid DecisionOutcome', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(output.outcome).toHaveProperty('approved');
      expect(output.outcome).toHaveProperty('status');
      expect(output.outcome).toHaveProperty('payout_total');
      expect(output.outcome).toHaveProperty('payout_breakdown');
      expect(output.outcome).toHaveProperty('deductible_applied');

      expect(typeof output.outcome.approved).toBe('boolean');
      expect(['Approved', 'Partial', 'Denied']).toContain(output.outcome.status);
      expect(typeof output.outcome.payout_total).toBe('number');
      expect(Array.isArray(output.outcome.payout_breakdown)).toBe(true);
      expect(typeof output.outcome.deductible_applied).toBe('number');
    });

    it('returns valid TraceSteps array', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(Array.isArray(output.traceSteps)).toBe(true);
      expect(output.traceSteps.length).toBeGreaterThan(0);

      const step = output.traceSteps[0];
      expect(step).toHaveProperty('step_id');
      expect(step).toHaveProperty('step_number');
      expect(step).toHaveProperty('label');
      expect(step).toHaveProperty('description');
      expect(step).toHaveProperty('inputs_used');
      expect(step).toHaveProperty('rule_refs');
      expect(step).toHaveProperty('evidence_refs');
      expect(step).toHaveProperty('output');
    });
  });

  describe('determinism', () => {
    it('produces identical outcome for identical input', () => {
      const input = createTestInput();
      const output1 = runDecision(input);
      const output2 = runDecision(input);

      // Outcome should be deterministic
      expect(output1.outcome).toEqual(output2.outcome);
    });

    it('produces identical trace steps for identical input', () => {
      const input = createTestInput();
      const output1 = runDecision(input);
      const output2 = runDecision(input);

      // Trace steps should be deterministic
      expect(output1.traceSteps).toEqual(output2.traceSteps);
    });

    it('generates different runIds for each call', () => {
      const input = createTestInput();
      const output1 = runDecision(input);
      const output2 = runDecision(input);

      // runIds should be unique even for same input
      expect(output1.runId).not.toBe(output2.runId);
    });
  });

  describe('stub behavior', () => {
    it('returns Denied status in stub implementation', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(output.outcome.status).toBe('Denied');
      expect(output.outcome.approved).toBe(false);
    });

    it('returns zero payout in stub implementation', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(output.outcome.payout_total).toBe(0);
    });

    it('applies CH_MOTOR_DEDUCTIBLE in stub implementation', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(output.outcome.deductible_applied).toBe(500);
    });
  });
});

// Placeholder tests for future stories (S2.7b/c/d)
describe('S2.7b: Line item coverage logic', () => {
  it.todo('covers base repair items always');
  it.todo('covers accessory items when interpretation is INCLUDED_BY_DEFAULT');
  it.todo('covers accessory items when INCLUDED_IF_DECLARED and assumption is DECLARED');
  it.todo('excludes accessory items when INCLUDED_IF_DECLARED and assumption is NOT_DECLARED');
  it.todo('excludes accessory items when interpretation is EXCLUDED');
});

describe('S2.7c: Payout calculation', () => {
  it.todo('calculates correct payout_total from covered items');
  it.todo('applies deductible correctly');
  it.todo('never returns negative payout');
  it.todo('sets status to Approved when payout > 0');
  it.todo('sets status to Denied when payout = 0');
  it.todo('sets status to Partial when some items excluded');
});

describe('S2.7d: Trace generation', () => {
  it.todo('generates sequential step numbers');
  it.todo('includes all decision points in trace');
  it.todo('references correct inputs in each step');
  it.todo('records final payout calculation step');
  it.todo('includes evidence_refs for relevant steps');
});
