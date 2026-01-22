import type {
  Claim,
  ClaimSummary,
  InterpretationSet,
  AssumptionSet,
  QACohort,
  QAProposedChange,
  QAStudyResult,
  ChangeProposal,
} from '@/types';

import claimsData from './claims.json';
import interpretationSetsData from './interpretation_sets.json';
import assumptionSetsData from './assumption_sets.json';
import qaResultsData from './qa_results.json';
import proposalsData from './proposals.json';

// Type assertions for JSON imports
export const claims: Claim[] = claimsData as Claim[];
export const interpretationSets: InterpretationSet[] = interpretationSetsData as InterpretationSet[];
export const assumptionSets: AssumptionSet[] = assumptionSetsData as AssumptionSet[];
export const proposals: ChangeProposal[] = proposalsData as ChangeProposal[];

// Helper to get claim summaries (for list views)
export function getClaimSummaries(): ClaimSummary[] {
  return claims.map(({ claim_id, jurisdiction, product_line, loss_date, status }) => ({
    claim_id,
    jurisdiction,
    product_line,
    loss_date,
    status,
  }));
}

// Helper to find a specific claim by ID
export function getClaimById(claimId: string): Claim | undefined {
  return claims.find((c) => c.claim_id === claimId);
}

// Helper to get the approved interpretation set for a jurisdiction/product
export function getApprovedInterpretationSet(
  jurisdiction: string,
  productLine: string
): InterpretationSet | undefined {
  return interpretationSets.find(
    (set) =>
      set.jurisdiction === jurisdiction &&
      set.product_line === productLine &&
      set.status === 'Approved'
  );
}

// Helper to get the approved assumption set for a jurisdiction/product
export function getApprovedAssumptionSet(
  jurisdiction: string,
  productLine: string
): AssumptionSet | undefined {
  return assumptionSets.find(
    (set) =>
      set.jurisdiction === jurisdiction &&
      set.product_line === productLine &&
      set.status === 'Approved'
  );
}

// Helper to get interpretation set by ID
export function getInterpretationSetById(setId: string): InterpretationSet | undefined {
  return interpretationSets.find((set) => set.interpretation_set_id === setId);
}

// Helper to get assumption set by ID
export function getAssumptionSetById(setId: string): AssumptionSet | undefined {
  return assumptionSets.find((set) => set.assumption_set_id === setId);
}

// Primary demo claim ID
export const PRIMARY_DEMO_CLAIM_ID = 'CLM-CH-001';

// Standard deductible for CH Motor
export const CH_MOTOR_DEDUCTIBLE = 500;

// QA Impact data
const qaData = qaResultsData as {
  cohorts: QACohort[];
  proposed_changes: QAProposedChange[];
  study_results: QAStudyResult[];
};

export const qaCohorts: QACohort[] = qaData.cohorts;
export const qaProposedChanges: QAProposedChange[] = qaData.proposed_changes;
export const qaStudyResults: QAStudyResult[] = qaData.study_results;

// Helper to get QA study result for a cohort + proposal combination
export function getQAStudyResult(cohortId: string, proposalId: string): QAStudyResult | undefined {
  return qaStudyResults.find(
    (result) => result.cohort_id === cohortId && result.proposal_id === proposalId
  );
}

// Helper to get all study results for a cohort
export function getStudyResultsForCohort(cohortId: string): QAStudyResult[] {
  return qaStudyResults.filter((result) => result.cohort_id === cohortId);
}

// Helper to get all study results for a proposal
export function getStudyResultsForProposal(proposalId: string): QAStudyResult[] {
  return qaStudyResults.filter((result) => result.proposal_id === proposalId);
}

// Governance proposals data
export function getProposals(): ChangeProposal[] {
  return proposals;
}

// Helper to get proposal by ID
export function getProposalById(proposalId: string): ChangeProposal | undefined {
  return proposals.find((p) => p.proposal_id === proposalId);
}
