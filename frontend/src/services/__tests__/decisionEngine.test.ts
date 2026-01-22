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

  describe('base coverage behavior (S2.7b)', () => {
    it('covers repair items and applies deductible', () => {
      const input = createTestInput();
      const output = runDecision(input);

      // mockClaim has repair (2500) + accessory (1200)
      // Only repair covered: 2500 - 500 deductible = 2000
      expect(output.outcome.payout_total).toBe(2000);
      expect(output.outcome.status).toBe('Partial'); // 1/2 items covered
      expect(output.outcome.approved).toBe(false);
    });

    it('applies CH_MOTOR_DEDUCTIBLE', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(output.outcome.deductible_applied).toBe(500);
    });

    it('includes repair items in payout_breakdown', () => {
      const input = createTestInput();
      const output = runDecision(input);

      expect(output.outcome.payout_breakdown).toHaveLength(1);
      expect(output.outcome.payout_breakdown[0].label).toBe('Rear bumper repair');
      expect(output.outcome.payout_breakdown[0].covered_amount).toBe(2500);
    });
  });
});

describe('S2.7c: Accessory coverage with interpretation/assumption', () => {
  it('covers accessory items when interpretation is INCLUDED_BY_DEFAULT', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_BY_DEFAULT' },
    ];
    // Assumption doesn't matter for INCLUDED_BY_DEFAULT
    input.resolvedAssumptions = [];

    const output = runDecision(input);

    // Both repair (2500) and accessory (1200) covered: 3700 - 500 = 3200
    expect(output.outcome.payout_total).toBe(3200);
    expect(output.outcome.status).toBe('Approved');
    expect(output.outcome.approved).toBe(true);
    expect(output.outcome.payout_breakdown).toHaveLength(2);
  });

  it('covers accessory items when INCLUDED_IF_DECLARED and assumption is DECLARED', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_IF_DECLARED' },
    ];
    input.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'DECLARED',
        chosen_by_role: 'Supervisor',
      },
    ];

    const output = runDecision(input);

    // Both repair (2500) and accessory (1200) covered: 3700 - 500 = 3200
    expect(output.outcome.payout_total).toBe(3200);
    expect(output.outcome.status).toBe('Approved');
    expect(output.outcome.approved).toBe(true);
    expect(output.outcome.payout_breakdown).toHaveLength(2);

    // Check that accessory is in breakdown
    const accessoryItem = output.outcome.payout_breakdown.find(
      (item) => item.label === 'Tow bar replacement'
    );
    expect(accessoryItem).toBeDefined();
    expect(accessoryItem?.covered_amount).toBe(1200);
  });

  it('excludes accessory items when INCLUDED_IF_DECLARED and assumption is NOT_DECLARED', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_IF_DECLARED' },
    ];
    input.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'NOT_DECLARED',
        chosen_by_role: 'Adjuster',
      },
    ];

    const output = runDecision(input);

    // Only repair (2500) covered: 2500 - 500 = 2000
    expect(output.outcome.payout_total).toBe(2000);
    expect(output.outcome.status).toBe('Partial');
    expect(output.outcome.approved).toBe(false);
    expect(output.outcome.payout_breakdown).toHaveLength(1);
    expect(output.outcome.payout_breakdown[0].label).toBe('Rear bumper repair');
  });

  it('excludes accessory items when interpretation is EXCLUDED', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'EXCLUDED' },
    ];
    // Assumption doesn't matter for EXCLUDED
    input.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'DECLARED',
        chosen_by_role: 'Supervisor',
      },
    ];

    const output = runDecision(input);

    // Only repair (2500) covered: 2500 - 500 = 2000
    expect(output.outcome.payout_total).toBe(2000);
    expect(output.outcome.status).toBe('Partial');
    expect(output.outcome.approved).toBe(false);
    expect(output.outcome.payout_breakdown).toHaveLength(1);
  });

  it('covers all items including multiple accessories when INCLUDED_BY_DEFAULT', () => {
    const input = createTestInput();
    input.claim = {
      ...mockClaim,
      line_items: [
        { item_id: 'LI-001', label: 'Bumper repair', amount_chf: 2500, category: 'repair' },
        { item_id: 'LI-002', label: 'Tow bar', amount_chf: 1200, category: 'accessory' },
        { item_id: 'LI-003', label: 'Roof rack', amount_chf: 800, category: 'accessory' },
      ],
    };
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_BY_DEFAULT' },
    ];

    const output = runDecision(input);

    // All items: 2500 + 1200 + 800 = 4500 - 500 = 4000
    expect(output.outcome.payout_total).toBe(4000);
    expect(output.outcome.status).toBe('Approved');
    expect(output.outcome.payout_breakdown).toHaveLength(3);
  });

  it('handles claim with no accessory items', () => {
    const input = createTestInput();
    input.claim = {
      ...mockClaim,
      line_items: [
        { item_id: 'LI-001', label: 'Bumper repair', amount_chf: 2500, category: 'repair' },
        { item_id: 'LI-002', label: 'Paint work', amount_chf: 800, category: 'repair' },
      ],
    };
    // Interpretation and assumption don't matter for repair-only claims
    input.selectedInterpretations = [];
    input.resolvedAssumptions = [];

    const output = runDecision(input);

    // All repair: 2500 + 800 = 3300 - 500 = 2800
    expect(output.outcome.payout_total).toBe(2800);
    expect(output.outcome.status).toBe('Approved');
    expect(output.outcome.payout_breakdown).toHaveLength(2);
  });

  it('calculates correct delta between DECLARED and NOT_DECLARED scenarios', () => {
    const baseInput = createTestInput();
    baseInput.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_IF_DECLARED' },
    ];

    // Scenario 1: NOT_DECLARED
    const notDeclaredInput = { ...baseInput };
    notDeclaredInput.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'NOT_DECLARED',
        chosen_by_role: 'Adjuster',
      },
    ];
    const notDeclaredOutput = runDecision(notDeclaredInput);

    // Scenario 2: DECLARED
    const declaredInput = { ...baseInput };
    declaredInput.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'DECLARED',
        chosen_by_role: 'Supervisor',
      },
    ];
    const declaredOutput = runDecision(declaredInput);

    // Delta should be the accessory amount (1200)
    const delta = declaredOutput.outcome.payout_total - notDeclaredOutput.outcome.payout_total;
    expect(delta).toBe(1200);
  });
});

describe('S2.7d: Enhanced trace generation', () => {
  it('includes fact evaluation step with evidence_refs', () => {
    const input = createTestInput();
    const output = runDecision(input);

    const factStep = output.traceSteps.find((s) => s.label === 'Evaluate Claim Facts');
    expect(factStep).toBeDefined();
    expect(factStep?.step_number).toBe(1);
    expect(factStep?.inputs_used).toContain('FACT.ACCESSORY_DECLARED');
    expect(factStep?.rule_refs).toContain('RULE.FACT_EVALUATION');
    // evidence_refs populated from claim evidence
    expect(Array.isArray(factStep?.evidence_refs)).toBe(true);
  });

  it('includes assumption resolution steps in trace when assumptions are resolved', () => {
    const input = createTestInput();
    input.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'NOT_DECLARED',
        chosen_by_role: 'Adjuster',
      },
    ];

    const output = runDecision(input);

    const assumptionStep = output.traceSteps.find((s) => s.label.includes('Apply Assumption'));
    expect(assumptionStep).toBeDefined();
    expect(assumptionStep?.label).toBe('Apply Assumption: Accessory Declared');
    expect(assumptionStep?.inputs_used).toContain('ASM.ACCESSORY_DECLARED');
    expect(assumptionStep?.inputs_used).toContain('FACT.ACCESSORY_DECLARED');
    expect(assumptionStep?.output).toContain('NOT_DECLARED');
    expect(assumptionStep?.output).toContain('Adjuster');
    expect(assumptionStep?.rule_refs).toContain('RULE.ASSUMPTION.ASM.ACCESSORY_DECLARED');
  });

  it('includes interpretation application step when interpretation is selected', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_IF_DECLARED' },
    ];

    const output = runDecision(input);

    const interpretationStep = output.traceSteps.find((s) => s.label === 'Apply Accessory Coverage Policy');
    expect(interpretationStep).toBeDefined();
    expect(interpretationStep?.inputs_used).toContain('DP.ACCESSORY_COVERAGE');
    expect(interpretationStep?.output_value).toBe('INCLUDED_IF_DECLARED');
    expect(interpretationStep?.rule_refs).toContain('RULE.INTERPRETATION.DP.ACCESSORY_COVERAGE');
  });

  it('includes line item coverage evaluation step', () => {
    const input = createTestInput();
    const output = runDecision(input);

    const coverageStep = output.traceSteps.find((s) => s.label === 'Evaluate Line Item Coverage');
    expect(coverageStep).toBeDefined();
    expect(coverageStep?.inputs_used).toContain('LI-001');
    expect(coverageStep?.inputs_used).toContain('LI-002');
    expect(coverageStep?.rule_refs).toContain('RULE.BASE_COVERAGE');
  });

  it('generates correct trace for full demo scenario (INCLUDED_IF_DECLARED + NOT_DECLARED)', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_IF_DECLARED' },
    ];
    input.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'NOT_DECLARED',
        chosen_by_role: 'Adjuster',
      },
    ];

    const output = runDecision(input);

    // Should have 7 steps: facts, assumption, interpretation, line items, gross, deductible, outcome
    expect(output.traceSteps.length).toBe(7);

    // Verify step ordering
    expect(output.traceSteps[0].label).toBe('Evaluate Claim Facts');
    expect(output.traceSteps[1].label).toBe('Apply Assumption: Accessory Declared');
    expect(output.traceSteps[2].label).toBe('Apply Accessory Coverage Policy');
    expect(output.traceSteps[3].label).toBe('Evaluate Line Item Coverage');
    expect(output.traceSteps[4].label).toBe('Calculate Gross Payout');
    expect(output.traceSteps[5].label).toBe('Apply Deductible');
    expect(output.traceSteps[6].label).toBe('Determine Final Outcome');

    // Verify final outcome reflects Partial status
    expect(output.traceSteps[6].output).toContain('Partial');
  });

  it('generates correct trace for INCLUDED_BY_DEFAULT (no assumption needed)', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_BY_DEFAULT' },
    ];
    input.resolvedAssumptions = [];

    const output = runDecision(input);

    // Should have 6 steps: facts, interpretation, line items, gross, deductible, outcome (no assumption step)
    expect(output.traceSteps.length).toBe(6);

    // Verify no assumption step
    const assumptionStep = output.traceSteps.find((s) => s.label.includes('Apply Assumption'));
    expect(assumptionStep).toBeUndefined();

    // Verify interpretation step shows INCLUDED_BY_DEFAULT
    const interpretationStep = output.traceSteps.find((s) => s.label === 'Apply Accessory Coverage Policy');
    expect(interpretationStep?.output).toContain('always covered');
  });

  it('generates correct trace for repair-only claims (no interpretation step)', () => {
    const input = createTestInput();
    input.claim = {
      ...mockClaim,
      line_items: [
        { item_id: 'LI-001', label: 'Bumper repair', amount_chf: 2500, category: 'repair' },
      ],
    };
    input.selectedInterpretations = [];
    input.resolvedAssumptions = [];

    const output = runDecision(input);

    // Should have 5 steps: facts, line items, gross, deductible, outcome (no assumption or interpretation)
    expect(output.traceSteps.length).toBe(5);

    // Verify no interpretation step
    const interpretationStep = output.traceSteps.find((s) => s.label === 'Apply Accessory Coverage Policy');
    expect(interpretationStep).toBeUndefined();
  });

  it('trace steps have sequential step_numbers', () => {
    const input = createTestInput();
    input.selectedInterpretations = [
      { decision_point_id: 'DP.ACCESSORY_COVERAGE', option: 'INCLUDED_IF_DECLARED' },
    ];
    input.resolvedAssumptions = [
      {
        assumption_id: 'ASM.ACCESSORY_DECLARED',
        fact_id: 'FACT.ACCESSORY_DECLARED',
        fact_label: 'Accessory Declared',
        chosen_resolution: 'NOT_DECLARED',
        chosen_by_role: 'Adjuster',
      },
    ];

    const output = runDecision(input);

    for (let i = 0; i < output.traceSteps.length; i++) {
      expect(output.traceSteps[i].step_number).toBe(i + 1);
    }
  });

  it('trace step_ids follow STEP-XXX format', () => {
    const input = createTestInput();
    const output = runDecision(input);

    for (const step of output.traceSteps) {
      expect(step.step_id).toMatch(/^STEP-\d{3}$/);
    }
  });
});
