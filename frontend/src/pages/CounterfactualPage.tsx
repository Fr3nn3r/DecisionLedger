import { useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ErrorState } from '@/components/shared/ErrorState';
import { CounterfactualSkeleton } from '@/components/shared/Skeleton';
import {
  getClaimById,
  getInterpretationSetById,
  getAssumptionSetById,
} from '@/data';
import { runDecision } from '@/services/decisionEngine';
import { formatCHF, formatDateTime, cn } from '@/lib/utils';
import { ArrowLeft, GitBranch, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type {
  ChangeType,
  DecisionStatus,
  DecisionRun,
  ResolvedAssumption,
  SelectedInterpretation,
  TraceStep,
  TraceDiff,
} from '@/types';

function StatusBadge({ status }: { status: DecisionStatus }) {
  const colors = {
    Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Denied: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span
      className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-medium', colors[status])}
    >
      {status}
    </span>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        No change
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
        <ArrowUpRight className="h-4 w-4" />
        +{formatCHF(delta)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
      <ArrowDownRight className="h-4 w-4" />
      {formatCHF(delta)}
    </span>
  );
}

/**
 * Compares two trace arrays and finds the first step that differs.
 */
function findTraceDiff(originalSteps: TraceStep[], newSteps: TraceStep[]): TraceDiff | null {
  for (let i = 0; i < Math.min(originalSteps.length, newSteps.length); i++) {
    const orig = originalSteps[i];
    const newer = newSteps[i];
    if (orig.output !== newer.output || orig.output_value !== newer.output_value) {
      return {
        changed_step_id: newer.step_id,
        changed_step_number: newer.step_number,
        original_output: orig.output,
        new_output: newer.output,
        summary: `Step ${newer.step_number} (${newer.label}) changed`,
      };
    }
  }
  return null;
}

export function CounterfactualPage() {
  const { runId } = useParams<{ runId: string }>();
  const { getDecisionRun } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [baseRun, setBaseRun] = useState<DecisionRun | undefined>(undefined);

  // State for change selection
  const [changeType, setChangeType] = useState<ChangeType | null>(null);
  const [selectedAssumptionId, setSelectedAssumptionId] = useState<string | null>(null);
  const [newAssumptionValue, setNewAssumptionValue] = useState<string | null>(null);
  const [selectedInterpretationId, setSelectedInterpretationId] = useState<string | null>(null);
  const [newInterpretationValue, setNewInterpretationValue] = useState<string | null>(null);

  // Simulate loading delay for realistic UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setBaseRun(runId ? getDecisionRun(runId) : undefined);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [runId, getDecisionRun]);

  // Get related data
  const claim = baseRun ? getClaimById(baseRun.claim_id) : undefined;
  const interpretationSet = baseRun
    ? getInterpretationSetById(baseRun.interpretation_set_id)
    : undefined;
  const assumptionSet = baseRun ? getAssumptionSetById(baseRun.assumption_set_id) : undefined;

  // Calculate whether we have a valid change selected
  const hasValidChange = useMemo(() => {
    if (changeType === 'ASSUMPTION') {
      return selectedAssumptionId && newAssumptionValue;
    }
    if (changeType === 'INTERPRETATION') {
      return selectedInterpretationId && newInterpretationValue;
    }
    return false;
  }, [changeType, selectedAssumptionId, newAssumptionValue, selectedInterpretationId, newInterpretationValue]);

  // Compute counterfactual result reactively (S8.3)
  const counterfactualResult = useMemo(() => {
    if (!baseRun || !claim || !interpretationSet || !assumptionSet || !hasValidChange) {
      return null;
    }

    // Build modified inputs based on change type
    let modifiedAssumptions: ResolvedAssumption[] = [...baseRun.resolved_assumptions];
    let modifiedInterpretations: SelectedInterpretation[] = [...baseRun.selected_interpretations];
    let changeRef = '';
    let originalValue = '';
    let newValue = '';

    if (changeType === 'ASSUMPTION' && selectedAssumptionId && newAssumptionValue) {
      // Find and modify the assumption
      modifiedAssumptions = baseRun.resolved_assumptions.map((ra) => {
        if (ra.assumption_id === selectedAssumptionId) {
          originalValue = ra.chosen_resolution;
          newValue = newAssumptionValue;
          changeRef = ra.fact_label;
          return { ...ra, chosen_resolution: newAssumptionValue };
        }
        return ra;
      });
    }

    if (changeType === 'INTERPRETATION' && selectedInterpretationId && newInterpretationValue) {
      // Find and modify the interpretation
      modifiedInterpretations = baseRun.selected_interpretations.map((si) => {
        if (si.decision_point_id === selectedInterpretationId) {
          originalValue = si.option;
          newValue = newInterpretationValue;
          // Find the label for this decision point
          const dp = interpretationSet.decision_points.find(
            (d) => d.decision_point_id === selectedInterpretationId
          );
          changeRef = dp?.label || selectedInterpretationId;
          return { ...si, option: newInterpretationValue };
        }
        return si;
      });
    }

    // Re-run the decision engine with modified inputs
    const newResult = runDecision({
      claim,
      interpretationSet,
      assumptionSet,
      resolvedAssumptions: modifiedAssumptions,
      selectedInterpretations: modifiedInterpretations,
    });

    // Calculate delta
    const delta = newResult.outcome.payout_total - baseRun.outcome.payout_total;

    // Find trace diff
    const traceDiff = findTraceDiff(baseRun.trace_steps, newResult.traceSteps);

    return {
      changeType: changeType!,
      changeRef,
      originalValue,
      newValue,
      newOutcome: newResult.outcome,
      delta,
      traceDiff,
      traceSteps: newResult.traceSteps,
    };
  }, [
    baseRun,
    claim,
    interpretationSet,
    assumptionSet,
    hasValidChange,
    changeType,
    selectedAssumptionId,
    newAssumptionValue,
    selectedInterpretationId,
    newInterpretationValue,
  ]);

  // Reset selection when change type changes
  const handleChangeTypeSelect = (type: ChangeType) => {
    setChangeType(type);
    setSelectedAssumptionId(null);
    setNewAssumptionValue(null);
    setSelectedInterpretationId(null);
    setNewInterpretationValue(null);
  };

  // Reset new value when assumption changes
  const handleAssumptionSelect = (id: string) => {
    setSelectedAssumptionId(id);
    setNewAssumptionValue(null);
  };

  // Reset new value when interpretation changes
  const handleInterpretationSelect = (id: string) => {
    setSelectedInterpretationId(id);
    setNewInterpretationValue(null);
  };

  if (isLoading) {
    return <CounterfactualSkeleton />;
  }

  if (!baseRun) {
    return (
      <ErrorState
        type="not-found"
        title="Decision Not Found"
        message={`The decision run "${runId}" could not be found.`}
        details="Decision runs are stored in memory during your session. They will be lost on page refresh. Run a new decision from the claims page to use the counterfactual simulator."
        actionLabel="Back to Claims"
        actionHref="/claims"
      />
    );
  }

  // Get available assumptions that were resolved in the base run
  const availableAssumptions = baseRun.resolved_assumptions;

  // Get decision points from the interpretation set that were selected
  const availableInterpretations =
    interpretationSet?.decision_points.filter((dp) =>
      baseRun.selected_interpretations.some((si) => si.decision_point_id === dp.decision_point_id)
    ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Counterfactual Simulator</h1>
          </div>
          <p className="text-muted-foreground">
            Explore "what-if" scenarios by changing exactly one assumption or interpretation.
          </p>
        </div>
        <Link
          to={`/decision-runs/${runId}`}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Receipt
        </Link>
      </div>

      {/* Base Run Info (S8.1) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Base Decision</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Run ID</p>
            <p className="font-mono text-sm">{baseRun.run_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Timestamp</p>
            <p className="text-sm">{formatDateTime(baseRun.timestamp)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
            <StatusBadge status={baseRun.outcome.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Payout</p>
            <p className="text-xl font-bold">{formatCHF(baseRun.outcome.payout_total)}</p>
          </div>
        </div>
      </div>

      {/* Change Selector (S8.1) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Select One Change</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose whether to change an assumption resolution or an interpretation option.
          Only one change is allowed per simulation.
        </p>

        {/* Change Type Radio */}
        <div className="flex gap-4 mb-6">
          <label
            className={cn(
              'flex-1 cursor-pointer rounded-lg border-2 p-4 transition-colors',
              changeType === 'ASSUMPTION'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            )}
          >
            <input
              type="radio"
              name="changeType"
              value="ASSUMPTION"
              checked={changeType === 'ASSUMPTION'}
              onChange={() => handleChangeTypeSelect('ASSUMPTION')}
              className="sr-only"
            />
            <div className="font-medium mb-1">Change Assumption</div>
            <div className="text-sm text-muted-foreground">
              Modify how an unknown fact was resolved ({availableAssumptions.length} available)
            </div>
          </label>
          <label
            className={cn(
              'flex-1 cursor-pointer rounded-lg border-2 p-4 transition-colors',
              changeType === 'INTERPRETATION'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
            )}
          >
            <input
              type="radio"
              name="changeType"
              value="INTERPRETATION"
              checked={changeType === 'INTERPRETATION'}
              onChange={() => handleChangeTypeSelect('INTERPRETATION')}
              className="sr-only"
            />
            <div className="font-medium mb-1">Change Interpretation</div>
            <div className="text-sm text-muted-foreground">
              Modify a policy decision point option ({availableInterpretations.length} available)
            </div>
          </label>
        </div>

        {/* Assumption Selection */}
        {changeType === 'ASSUMPTION' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Assumption to Change</label>
              <select
                value={selectedAssumptionId || ''}
                onChange={(e) => handleAssumptionSelect(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">-- Select an assumption --</option>
                {availableAssumptions.map((ra) => (
                  <option key={ra.assumption_id} value={ra.assumption_id}>
                    {ra.fact_label} (currently: {ra.chosen_resolution})
                  </option>
                ))}
              </select>
            </div>

            {selectedAssumptionId && (
              <div>
                <label className="block text-sm font-medium mb-2">Select New Resolution</label>
                {(() => {
                  const assumption = assumptionSet?.assumptions.find(
                    (a) => a.assumption_id === selectedAssumptionId
                  );
                  const currentValue = availableAssumptions.find(
                    (ra) => ra.assumption_id === selectedAssumptionId
                  )?.chosen_resolution;

                  return (
                    <div className="space-y-2">
                      {assumption?.alternatives.map((alt) => (
                        <label
                          key={alt.alternative_id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                            alt.alternative_id === currentValue
                              ? 'border-muted bg-muted/30 cursor-not-allowed opacity-60'
                              : newAssumptionValue === alt.alternative_id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/50'
                          )}
                        >
                          <input
                            type="radio"
                            name="newAssumptionValue"
                            value={alt.alternative_id}
                            checked={newAssumptionValue === alt.alternative_id}
                            onChange={() => setNewAssumptionValue(alt.alternative_id)}
                            disabled={alt.alternative_id === currentValue}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alt.label}</div>
                            <div className="text-xs text-muted-foreground">{alt.description}</div>
                          </div>
                          {alt.alternative_id === currentValue && (
                            <span className="text-xs text-muted-foreground">(current)</span>
                          )}
                        </label>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Interpretation Selection */}
        {changeType === 'INTERPRETATION' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Interpretation to Change
              </label>
              <select
                value={selectedInterpretationId || ''}
                onChange={(e) => handleInterpretationSelect(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">-- Select a decision point --</option>
                {availableInterpretations.map((dp) => {
                  const currentOption = baseRun.selected_interpretations.find(
                    (si) => si.decision_point_id === dp.decision_point_id
                  )?.option;
                  const optionLabel =
                    dp.options.find((o) => o.option_id === currentOption)?.label || currentOption;
                  return (
                    <option key={dp.decision_point_id} value={dp.decision_point_id}>
                      {dp.label} (currently: {optionLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedInterpretationId && (
              <div>
                <label className="block text-sm font-medium mb-2">Select New Option</label>
                {(() => {
                  const dp = availableInterpretations.find(
                    (d) => d.decision_point_id === selectedInterpretationId
                  );
                  const currentValue = baseRun.selected_interpretations.find(
                    (si) => si.decision_point_id === selectedInterpretationId
                  )?.option;

                  return (
                    <div className="space-y-2">
                      {dp?.options.map((opt) => (
                        <label
                          key={opt.option_id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                            opt.option_id === currentValue
                              ? 'border-muted bg-muted/30 cursor-not-allowed opacity-60'
                              : newInterpretationValue === opt.option_id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/50'
                          )}
                        >
                          <input
                            type="radio"
                            name="newInterpretationValue"
                            value={opt.option_id}
                            checked={newInterpretationValue === opt.option_id}
                            onChange={() => setNewInterpretationValue(opt.option_id)}
                            disabled={opt.option_id === currentValue}
                            className="h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{opt.label}</div>
                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                          </div>
                          {opt.option_id === currentValue && (
                            <span className="text-xs text-muted-foreground">(current)</span>
                          )}
                        </label>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Display (S8.2) */}
      {counterfactualResult && (
        <div className="rounded-lg border-2 border-primary bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Counterfactual Result</h2>

          {/* Summary */}
          <div className="rounded-lg bg-muted/30 p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-2">What changed:</p>
            <p className="font-medium">
              {counterfactualResult.changeRef}:{' '}
              <span className="text-muted-foreground line-through">
                {counterfactualResult.originalValue}
              </span>
              {' → '}
              <span className="text-primary">{counterfactualResult.newValue}</span>
            </p>
          </div>

          {/* Outcome Comparison */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Original Payout
              </p>
              <p className="text-xl font-bold">{formatCHF(baseRun.outcome.payout_total)}</p>
              <StatusBadge status={baseRun.outcome.status} />
            </div>
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                New Payout
              </p>
              <p className="text-xl font-bold">
                {formatCHF(counterfactualResult.newOutcome.payout_total)}
              </p>
              <StatusBadge status={counterfactualResult.newOutcome.status} />
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Delta</p>
              <div className="text-xl font-bold">
                <DeltaBadge delta={counterfactualResult.delta} />
              </div>
            </div>
          </div>

          {/* Trace Diff */}
          {counterfactualResult.traceDiff && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20 p-4">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                {counterfactualResult.traceDiff.summary}
              </p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Original: </span>
                  <span className="line-through">
                    {counterfactualResult.traceDiff.original_output}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">New: </span>
                  <span className="font-medium">{counterfactualResult.traceDiff.new_output}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payout Breakdown Comparison */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-3">Payout Breakdown Comparison</h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-right font-medium">Original</th>
                    <th className="px-4 py-2 text-right font-medium">New</th>
                    <th className="px-4 py-2 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {(() => {
                    // Merge items from both breakdowns
                    const allItemIds = new Set([
                      ...baseRun.outcome.payout_breakdown.map((i) => i.item_id),
                      ...counterfactualResult.newOutcome.payout_breakdown.map((i) => i.item_id),
                    ]);

                    return Array.from(allItemIds).map((itemId) => {
                      const original = baseRun.outcome.payout_breakdown.find(
                        (i) => i.item_id === itemId
                      );
                      const newItem = counterfactualResult.newOutcome.payout_breakdown.find(
                        (i) => i.item_id === itemId
                      );
                      const label = original?.label || newItem?.label || itemId;
                      const origAmount = original?.covered_amount || 0;
                      const newAmount = newItem?.covered_amount || 0;
                      const change = newAmount - origAmount;

                      return (
                        <tr
                          key={itemId}
                          className={cn(
                            'border-b border-border last:border-b-0',
                            change !== 0 && 'bg-yellow-50/50 dark:bg-yellow-950/10'
                          )}
                        >
                          <td className="px-4 py-2 font-medium">{label}</td>
                          <td className="px-4 py-2 text-right">
                            {origAmount > 0 ? formatCHF(origAmount) : '-'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {newAmount > 0 ? formatCHF(newAmount) : '-'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {change !== 0 ? (
                              <span
                                className={cn(
                                  'font-medium',
                                  change > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                )}
                              >
                                {change > 0 ? '+' : ''}
                                {formatCHF(change)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  {/* Deductible Row */}
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="px-4 py-2 font-medium">Deductible</td>
                    <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">
                      -{formatCHF(baseRun.outcome.deductible_applied)}
                    </td>
                    <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">
                      -{formatCHF(counterfactualResult.newOutcome.deductible_applied)}
                    </td>
                    <td className="px-4 py-2 text-right">-</td>
                  </tr>
                  {/* Total Row */}
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-4 py-2">Net Payout</td>
                    <td className="px-4 py-2 text-right">
                      {formatCHF(baseRun.outcome.payout_total)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCHF(counterfactualResult.newOutcome.payout_total)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <DeltaBadge delta={counterfactualResult.delta} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no change selected */}
      {!counterfactualResult && changeType && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
          <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a change above to see the counterfactual result.</p>
        </div>
      )}
    </div>
  );
}
