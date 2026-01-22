import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Info } from 'lucide-react';
import { WizardStepper, WizardStep } from '@/components/wizard/WizardStepper';
import { ErrorState } from '@/components/shared/ErrorState';
import { useToast } from '@/components/shared/Toast';
import {
  getClaimById,
  getApprovedInterpretationSet,
  getApprovedAssumptionSet,
} from '@/data';
import { useApp } from '@/context/AppContext';
import { formatDate, cn, formatCHF } from '@/lib/utils';
import { runDecision } from '@/services/decisionEngine';
import type {
  Claim,
  InterpretationSet,
  AssumptionSet,
  Assumption,
  ResolvedAssumption,
  SelectedInterpretation,
  DecisionRun,
} from '@/types';

const WIZARD_STEPS: WizardStep[] = [
  { id: 'setup', label: 'Setup' },
  { id: 'resolve-assumptions', label: 'Resolve Assumptions' },
  { id: 'complete', label: 'Complete' },
];

interface AssumptionResolution {
  assumptionId: string;
  selectedAlternativeId: string;
  reason?: string;
}

export function DecisionWizardPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { currentRole, addDecisionRun, publishedVersion } = useApp();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [resolutions, setResolutions] = useState<Map<string, AssumptionResolution>>(new Map());
  const [decisionRun, setDecisionRun] = useState<DecisionRun | null>(null);

  // Load claim and governance sets
  const claim = claimId ? getClaimById(claimId) : undefined;
  const interpretationSet = claim
    ? getApprovedInterpretationSet(claim.jurisdiction, claim.product_line)
    : undefined;
  const assumptionSet = claim
    ? getApprovedAssumptionSet(claim.jurisdiction, claim.product_line)
    : undefined;

  // Find triggered assumptions (based on UNKNOWN facts)
  const triggeredAssumptions = useMemo(() => {
    if (!claim || !assumptionSet) return [];
    const unknownFactIds = claim.facts
      .filter((f) => f.status === 'UNKNOWN')
      .map((f) => f.fact_id);
    return assumptionSet.assumptions.filter((a) =>
      unknownFactIds.includes(a.trigger_fact_id)
    );
  }, [claim, assumptionSet]);

  // Initialize resolutions with recommended values
  useMemo(() => {
    if (triggeredAssumptions.length > 0 && resolutions.size === 0) {
      const initial = new Map<string, AssumptionResolution>();
      triggeredAssumptions.forEach((a) => {
        initial.set(a.assumption_id, {
          assumptionId: a.assumption_id,
          selectedAlternativeId: a.recommended_resolution,
        });
      });
      setResolutions(initial);
    }
  }, [triggeredAssumptions, resolutions.size]);

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(`/claims/${claimId}`);
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      // If moving from resolve assumptions to complete, generate the decision
      if (currentStep === 1) {
        generateDecision();
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const generateDecision = () => {
    if (!claim || !interpretationSet || !assumptionSet) return;

    // Build resolved assumptions
    const resolvedAssumptions: ResolvedAssumption[] = triggeredAssumptions.map((a) => {
      const resolution = resolutions.get(a.assumption_id);
      const fact = claim.facts.find((f) => f.fact_id === a.trigger_fact_id);
      return {
        assumption_id: a.assumption_id,
        fact_id: a.trigger_fact_id,
        fact_label: fact?.label || a.trigger_fact_id,
        chosen_resolution: resolution?.selectedAlternativeId || a.recommended_resolution,
        chosen_by_role: currentRole,
        reason: resolution?.reason,
      };
    });

    // Use default interpretations
    const selectedInterpretations: SelectedInterpretation[] = interpretationSet.decision_points.map(
      (dp) => ({
        decision_point_id: dp.decision_point_id,
        option: dp.default_option,
      })
    );

    // Run the decision engine
    const result = runDecision({
      claim,
      interpretationSet,
      assumptionSet,
      resolvedAssumptions,
      selectedInterpretations,
    });

    // Create full decision run
    const run: DecisionRun = {
      run_id: result.runId,
      claim_id: claim.claim_id,
      timestamp: result.timestamp,
      interpretation_set_id: interpretationSet.interpretation_set_id,
      interpretation_set_version: interpretationSet.version,
      assumption_set_id: assumptionSet.assumption_set_id,
      assumption_set_version: assumptionSet.version,
      resolved_assumptions: resolvedAssumptions,
      selected_interpretations: selectedInterpretations,
      outcome: result.outcome,
      trace_steps: result.traceSteps,
      generated_by_role: currentRole,
    };

    setDecisionRun(run);
    addDecisionRun(run);
    showToast(
      'success',
      'Decision generated',
      `${run.outcome.status}: ${formatCHF(run.outcome.payout_total)} payout`
    );
  };

  const handleComplete = () => {
    if (decisionRun) {
      navigate(`/decision-runs/${decisionRun.run_id}`);
    } else {
      navigate(`/claims/${claimId}`);
    }
  };

  const updateResolution = (assumptionId: string, alternativeId: string, reason?: string) => {
    setResolutions((prev) => {
      const next = new Map(prev);
      next.set(assumptionId, {
        assumptionId,
        selectedAlternativeId: alternativeId,
        reason,
      });
      return next;
    });
  };

  if (!claim) {
    return (
      <ErrorState
        type="not-found"
        title="Claim Not Found"
        message={`The claim "${claimId}" could not be found in the system.`}
        details="The claim ID may be incorrect, or the claim may have been removed."
        actionLabel="Back to Claims"
        actionHref="/claims"
      />
    );
  }

  if (!interpretationSet || !assumptionSet) {
    return (
      <ErrorState
        type="config-error"
        title="Configuration Error"
        message={`No approved governance sets found for ${claim.jurisdiction} / ${claim.product_line}.`}
        details="An approved Interpretation Set and Assumption Set are required to run decisions. Contact your administrator to configure governance for this jurisdiction and product line."
        actionLabel="Back to Claim"
        actionHref={`/claims/${claimId}`}
      />
    );
  }

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  // Check if all required resolutions are valid for current role
  const canProceed = useMemo(() => {
    if (currentStep !== 1) return true;
    for (const assumption of triggeredAssumptions) {
      const resolution = resolutions.get(assumption.assumption_id);
      if (!resolution) return false;
      const alternative = assumption.alternatives.find(
        (a) => a.alternative_id === resolution.selectedAlternativeId
      );
      if (!alternative) return false;
      if (!alternative.allowed_roles.includes(currentRole)) return false;
    }
    return true;
  }, [currentStep, triggeredAssumptions, resolutions, currentRole]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Decision Wizard</h1>
      <p className="mb-6 text-muted-foreground">
        Running decision for claim:{' '}
        <span className="font-medium text-foreground">{claimId}</span>
      </p>

      <WizardStepper
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* Step content */}
      <div className="rounded-lg border border-border bg-card p-6">
        {currentStep === 0 && (
          <SetupStep
            claim={claim}
            interpretationSet={interpretationSet}
            assumptionSet={assumptionSet}
            triggeredAssumptions={triggeredAssumptions}
            publishedVersion={publishedVersion}
          />
        )}
        {currentStep === 1 && (
          <ResolveAssumptionsStep
            triggeredAssumptions={triggeredAssumptions}
            resolutions={resolutions}
            currentRole={currentRole}
            onUpdateResolution={updateResolution}
          />
        )}
        {currentStep === 2 && <CompleteStep decisionRun={decisionRun} />}
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          {isFirstStep ? 'Back to Claim' : 'Back'}
        </button>

        {isLastStep ? (
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-4 w-4" />
            View Receipt
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={cn(
              'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
              canProceed
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {currentStep === 1 ? 'Generate Decision' : 'Continue'}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Setup Step Component
interface PublishedVersionInfo {
  proposalId: string;
  proposalType: 'Assumption' | 'Interpretation';
  version: string;
  publishedAt: string;
}

interface SetupStepProps {
  claim: Claim;
  interpretationSet: InterpretationSet;
  assumptionSet: AssumptionSet;
  triggeredAssumptions: Assumption[];
  publishedVersion: PublishedVersionInfo | null;
}

function SetupStep({
  claim,
  interpretationSet,
  assumptionSet,
  triggeredAssumptions,
  publishedVersion,
}: SetupStepProps) {
  return (
    <div className="space-y-6">
      {/* Published Version Banner */}
      {publishedVersion && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
          <Check className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200">
              New {publishedVersion.proposalType} Version Active
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Version <span className="font-semibold">{publishedVersion.version}</span> was just published.
              This decision will use the newly published defaults.
            </p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Governance Context</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The following versioned rule sets will govern this decision. These are automatically
          selected based on the claim's jurisdiction and product line.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Interpretation Set Card */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium">Interpretation Set</h3>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {interpretationSet.status}
            </span>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{interpretationSet.interpretation_set_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-semibold text-primary">{interpretationSet.version}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Effective From</dt>
              <dd>{formatDate(interpretationSet.effective_from)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Decision Points</dt>
              <dd>{interpretationSet.decision_points.length}</dd>
            </div>
          </dl>
        </div>

        {/* Assumption Set Card */}
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium">Assumption Set</h3>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {assumptionSet.status}
            </span>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{assumptionSet.assumption_set_id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-semibold text-primary">{assumptionSet.version}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Jurisdiction</dt>
              <dd>{assumptionSet.jurisdiction}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Assumptions</dt>
              <dd>{assumptionSet.assumptions.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Triggered Assumptions Notice */}
      {triggeredAssumptions.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              {triggeredAssumptions.length} Assumption
              {triggeredAssumptions.length > 1 ? 's' : ''} Required
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              This claim has {triggeredAssumptions.length} unknown fact
              {triggeredAssumptions.length > 1 ? 's' : ''} that require assumption resolutions in
              the next step.
            </p>
          </div>
        </div>
      )}

      {triggeredAssumptions.length === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
          <Check className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800 dark:text-green-200">
              No Assumptions Required
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              All facts are known. The decision can proceed without any assumptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Resolve Assumptions Step Component
interface ResolveAssumptionsStepProps {
  triggeredAssumptions: Assumption[];
  resolutions: Map<string, AssumptionResolution>;
  currentRole: string;
  onUpdateResolution: (assumptionId: string, alternativeId: string, reason?: string) => void;
}

function ResolveAssumptionsStep({
  triggeredAssumptions,
  resolutions,
  currentRole,
  onUpdateResolution,
}: ResolveAssumptionsStepProps) {
  if (triggeredAssumptions.length === 0) {
    return (
      <div className="py-8 text-center">
        <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">No Assumptions Needed</h2>
        <p className="text-muted-foreground">
          All facts are known for this claim. You can proceed to generate the decision.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Resolve Unknown Facts</h2>
        <p className="text-sm text-muted-foreground">
          The following facts are unknown and require an assumption. Select how to resolve each
          one. The recommended option is pre-selected.
        </p>
      </div>

      {triggeredAssumptions.map((assumption) => {
        const resolution = resolutions.get(assumption.assumption_id);
        const selectedAltId = resolution?.selectedAlternativeId || assumption.recommended_resolution;

        return (
          <div
            key={assumption.assumption_id}
            className="rounded-lg border border-border p-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{assumption.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{assumption.description}</p>
              </div>
              <RiskTierBadge tier={assumption.risk_tier} />
            </div>

            <div className="space-y-2">
              {assumption.alternatives.map((alt) => {
                const isAllowed = alt.allowed_roles.includes(currentRole);
                const isSelected = selectedAltId === alt.alternative_id;
                const isRecommended = assumption.recommended_resolution === alt.alternative_id;

                return (
                  <label
                    key={alt.alternative_id}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50',
                      !isAllowed && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <input
                      type="radio"
                      name={assumption.assumption_id}
                      value={alt.alternative_id}
                      checked={isSelected}
                      disabled={!isAllowed}
                      onChange={() => onUpdateResolution(assumption.assumption_id, alt.alternative_id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alt.label}</span>
                        {isRecommended && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                            Recommended
                          </span>
                        )}
                        {!isAllowed && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            Requires {alt.allowed_roles[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Show reason input if non-recommended option selected */}
            {selectedAltId !== assumption.recommended_resolution && (
              <div className="pt-2">
                <label className="block text-sm font-medium mb-1">
                  Reason for non-recommended selection
                </label>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Explain why you chose this option..."
                  value={resolution?.reason || ''}
                  onChange={(e) =>
                    onUpdateResolution(assumption.assumption_id, selectedAltId, e.target.value)
                  }
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Your current role is <span className="font-medium text-foreground">{currentRole}</span>.
          Some options may be restricted based on your role. Contact a supervisor to access
          restricted options.
        </p>
      </div>
    </div>
  );
}

// Complete Step Component
interface CompleteStepProps {
  decisionRun: DecisionRun | null;
}

function CompleteStep({ decisionRun }: CompleteStepProps) {
  if (!decisionRun) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">Generating decision...</p>
      </div>
    );
  }

  return (
    <div className="py-8 text-center">
      <div
        className={cn(
          'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full',
          decisionRun.outcome.approved ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        )}
      >
        <Check
          className={cn(
            'h-8 w-8',
            decisionRun.outcome.approved ? 'text-green-600' : 'text-red-600'
          )}
        />
      </div>
      <h2 className="text-lg font-semibold mb-2">Decision Generated</h2>
      <p className="text-muted-foreground mb-4">
        Run ID: <span className="font-mono text-sm">{decisionRun.run_id}</span>
      </p>
      <div className="inline-flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-6 py-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Status</p>
          <p
            className={cn(
              'text-lg font-semibold',
              decisionRun.outcome.approved ? 'text-green-600' : 'text-red-600'
            )}
          >
            {decisionRun.outcome.status}
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Payout</p>
          <p className="text-lg font-semibold">
            CHF {decisionRun.outcome.payout_total.toLocaleString('de-CH')}
          </p>
        </div>
      </div>
    </div>
  );
}

// Risk Tier Badge Component
function RiskTierBadge({ tier }: { tier: string }) {
  const colors = {
    Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors[tier as keyof typeof colors] || colors.Medium
      )}
    >
      {tier} Risk
    </span>
  );
}
