// Role types
export type Role = 'Adjuster' | 'Supervisor' | 'QA Lead' | 'Policy Owner';

// Claim types
export type FactStatus = 'KNOWN' | 'UNKNOWN';
export type ClaimStatus = 'Ready' | 'Decided';

export interface Fact {
  fact_id: string;
  label: string;
  value: string | null;
  status: FactStatus;
  source: string;
}

export interface Evidence {
  evidence_id: string;
  label: string;
  type: string;
  url: string;
}

export interface LineItem {
  item_id: string;
  label: string;
  amount_chf: number;
  category: string;
}

export interface ClaimSummary {
  claim_id: string;
  jurisdiction: string;
  product_line: string;
  loss_date: string;
  status: ClaimStatus;
}

export interface Claim {
  claim_id: string;
  jurisdiction: string;
  product_line: string;
  loss_date: string;
  policy_id: string;
  status: ClaimStatus;
  facts: Fact[];
  evidence: Evidence[];
  line_items: LineItem[];
}

// Catalog types
export type SetStatus = 'Draft' | 'Approved' | 'Deprecated';
export type RiskTier = 'Low' | 'Medium' | 'High';

export interface DecisionOption {
  option_id: string;
  label: string;
  description: string;
}

export interface DecisionPoint {
  decision_point_id: string;
  label: string;
  description: string;
  options: DecisionOption[];
  default_option: string;
  owner: string;
  status: SetStatus;
}

export interface InterpretationSet {
  interpretation_set_id: string;
  jurisdiction: string;
  product_line: string;
  effective_from: string;
  version: string;
  status: SetStatus;
  decision_points: DecisionPoint[];
}

export interface AssumptionAlternative {
  alternative_id: string;
  label: string;
  description: string;
  allowed_roles: Role[];
}

export interface Assumption {
  assumption_id: string;
  label: string;
  trigger: string;
  trigger_fact_id: string;
  description: string;
  recommended_resolution: string;
  alternatives: AssumptionAlternative[];
  risk_tier: RiskTier;
}

export interface AssumptionSet {
  assumption_set_id: string;
  jurisdiction: string;
  product_line: string;
  version: string;
  status: SetStatus;
  assumptions: Assumption[];
}

// Decision types
export type DecisionStatus = 'Approved' | 'Partial' | 'Denied';
export type ChangeType = 'ASSUMPTION' | 'INTERPRETATION';

export interface PayoutItem {
  item_id: string;
  label: string;
  covered_amount: number;
  notes: string;
}

export interface DecisionOutcome {
  approved: boolean;
  status: DecisionStatus;
  payout_total: number;
  payout_breakdown: PayoutItem[];
  deductible_applied: number;
}

export interface ResolvedAssumption {
  assumption_id: string;
  fact_id: string;
  fact_label: string;
  chosen_resolution: string;
  chosen_by_role: string;
  reason?: string;
}

export interface SelectedInterpretation {
  decision_point_id: string;
  option: string;
}

export interface TraceStep {
  step_id: string;
  step_number: number;
  label: string;
  description: string;
  inputs_used: string[];
  rule_refs: string[];
  evidence_refs: string[];
  output: string;
  output_value?: string;
}

export interface DecisionRun {
  run_id: string;
  claim_id: string;
  timestamp: string;
  interpretation_set_id: string;
  interpretation_set_version: string;
  assumption_set_id: string;
  assumption_set_version: string;
  resolved_assumptions: ResolvedAssumption[];
  selected_interpretations: SelectedInterpretation[];
  outcome: DecisionOutcome;
  trace_steps: TraceStep[];
  generated_by_role: string;
}

export interface TraceDiff {
  changed_step_id: string;
  changed_step_number: number;
  original_output: string;
  new_output: string;
  summary: string;
}

export interface CounterfactualRun {
  base_run_id: string;
  change_type: ChangeType;
  change_ref: string;
  original_value: string;
  new_value: string;
  new_outcome: DecisionOutcome;
  delta: number;
  trace_diff: TraceDiff;
}

// Governance types
export type ProposalStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Published' | 'Rejected';
export type ProposalType = 'Assumption' | 'Interpretation';

export interface QAImpactSummary {
  cohort_id: string;
  cohort_label: string;
  impacted_claims_count: number;
  total_delta_payout: number;
}

export interface ApprovalStep {
  step_name: string;
  required_role: string;
  status: string;
  completed_at?: string;
  completed_by?: string;
}

export interface ChangeProposal {
  proposal_id: string;
  title: string;
  proposal_type: ProposalType;
  proposed_version: string;
  rationale: string;
  qa_impact_summary?: QAImpactSummary;
  status: ProposalStatus;
  created_at: string;
  created_by: string;
  approved_at?: string;
  approved_by?: string;
  published_at?: string;
  approval_steps: ApprovalStep[];
}

// QA types
export type QAFlag = 'INCONSISTENCY_DETECTED' | 'HIGH_IMPACT' | 'LOW_CONFIDENCE';

export interface ImpactedClaim {
  claim_id: string;
  delta: number;
}

export interface QACohort {
  cohort_id: string;
  label: string;
  description: string;
  claim_count: number;
}

export interface QAProposedChange {
  proposal_id: string;
  label: string;
  description: string;
  change_type: string;
}

export interface QAStudyResult {
  cohort_id: string;
  cohort_label: string;
  proposal_id: string;
  proposal_label: string;
  impacted_claims_count: number;
  total_delta_payout: number;
  top_impacted_claims: ImpactedClaim[];
  flags: QAFlag[];
}
