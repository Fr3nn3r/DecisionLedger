import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { getClaimById } from '@/data';
import { ErrorState } from '@/components/shared/ErrorState';
import { DecisionReceiptSkeleton } from '@/components/shared/Skeleton';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { LabeledValue } from '@/components/shared/LabeledValue';
import { OutcomeBadge } from '@/components/shared/badges';
import { formatCHF, formatDateTime } from '@/lib/utils';
import { GitBranch, Eye, Download, Shield, ListChecks, Hash, Clock, User, Lightbulb, FileKey } from 'lucide-react';
import type { DecisionRun } from '@/types';

export function DecisionReceiptPage() {
  const { runId } = useParams<{ runId: string }>();
  const { getDecisionRun } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [decisionRun, setDecisionRun] = useState<DecisionRun | undefined>(undefined);

  // Simulate loading delay for realistic UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDecisionRun(runId ? getDecisionRun(runId) : undefined);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [runId, getDecisionRun]);

  const _claim = decisionRun ? getClaimById(decisionRun.claim_id) : undefined;
  void _claim; // Reserved for future use

  if (isLoading) {
    return <DecisionReceiptSkeleton />;
  }

  if (!decisionRun) {
    return (
      <ErrorState
        type="not-found"
        title="Decision Not Found"
        message={`The decision run "${runId}" could not be found.`}
        details="Decision runs are stored in memory during your session. They will be lost on page refresh. Run a new decision from the claims page."
        actionLabel="Back to Claims"
        actionHref="/claims"
      />
    );
  }

  const { outcome } = decisionRun;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Decision Receipt</h1>
          <p className="mt-1 text-muted-foreground">
            Claim:{' '}
            <Link
              to={`/claims/${decisionRun.claim_id}`}
              className="text-primary hover:underline"
            >
              {decisionRun.claim_id}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/decision-runs/${runId}/trace`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            View Trace
          </Link>
          <Link
            to={`/decision-runs/${runId}/counterfactual`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <GitBranch className="h-4 w-4" />
            Simulate Alternative
          </Link>
          <button
            onClick={() => alert('PDF export coming soon')}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary Section (S6.1) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <OutcomeBadge status={outcome.status} size="lg" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Payout</p>
            <p className="text-3xl font-bold tabular-nums">{formatCHF(outcome.payout_total)}</p>
          </div>
        </div>

        {/* Payout Breakdown Table */}
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Covered Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {outcome.payout_breakdown.length > 0 ? (
                outcome.payout_breakdown.map((item) => (
                  <tr key={item.item_id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-sm font-medium">{item.label}</td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {formatCHF(item.covered_amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No items covered
                  </td>
                </tr>
              )}
              {/* Deductible Row */}
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="px-4 py-3 text-sm font-medium">Deductible Applied</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-red-600 dark:text-red-400 tabular-nums">
                  -{formatCHF(outcome.deductible_applied)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">Standard deductible</td>
              </tr>
              {/* Total Row */}
              <tr className="bg-muted/50 font-semibold">
                <td className="px-4 py-3 text-sm">Net Payout</td>
                <td className="px-4 py-3 text-right text-sm tabular-nums">{formatCHF(outcome.payout_total)}</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance Block (S6.2) */}
      <div className="rounded-lg border border-border bg-card p-6">
        <SectionHeader icon={Shield} className="mb-4">Governance & Audit</SectionHeader>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <LabeledValue icon={Hash} label="Run ID" mono>
              {decisionRun.run_id}
            </LabeledValue>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <LabeledValue icon={Clock} label="Timestamp">
              {formatDateTime(decisionRun.timestamp)}
            </LabeledValue>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <LabeledValue icon={User} label="Generated By">
              {decisionRun.generated_by_role}
            </LabeledValue>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <LabeledValue icon={Lightbulb} label="Interpretation Set" mono>
              <span className="block">{decisionRun.interpretation_set_id}</span>
              <span className="text-sm font-semibold text-primary">
                v{decisionRun.interpretation_set_version}
              </span>
            </LabeledValue>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <LabeledValue icon={GitBranch} label="Assumption Set" mono>
              <span className="block">{decisionRun.assumption_set_id}</span>
              <span className="text-sm font-semibold text-primary">
                v{decisionRun.assumption_set_version}
              </span>
            </LabeledValue>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <LabeledValue icon={FileKey} label="Claim ID" mono>
              {decisionRun.claim_id}
            </LabeledValue>
          </div>
        </dl>
      </div>

      {/* Resolved Unknowns Section (S6.3) */}
      {decisionRun.resolved_assumptions.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-4 text-yellow-800 dark:text-yellow-200">
            <GitBranch className="h-5 w-5" />
            Resolved Assumptions ({decisionRun.resolved_assumptions.length})
          </h2>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            The following unknown facts were resolved using assumptions during this decision.
          </p>
          <div className="space-y-3">
            {decisionRun.resolved_assumptions.map((ra) => (
              <div
                key={ra.assumption_id}
                className="rounded-lg border border-yellow-200 bg-white dark:border-yellow-800 dark:bg-yellow-950/30 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{ra.fact_label}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="text-yellow-700 dark:text-yellow-400">Unknown</span>
                      {' → '}
                      <span className="font-medium text-foreground">{ra.chosen_resolution}</span>
                    </p>
                    {ra.reason && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        Reason: {ra.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Chosen by</p>
                    <p className="font-medium">{ra.chosen_by_role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisive Steps Preview (S6.4) */}
      {decisionRun.trace_steps.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ListChecks className="h-5 w-5 text-muted-foreground" />
              Key Decision Steps
            </h2>
            <Link
              to={`/decision-runs/${runId}/trace`}
              className="text-sm text-primary hover:underline"
            >
              View Full Trace →
            </Link>
          </div>
          <div className="space-y-3">
            {decisionRun.trace_steps.slice(0, 3).map((step) => (
              <div
                key={step.step_id}
                className="flex items-start gap-4 rounded-lg border border-border p-4"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {step.step_number}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Output:</span>{' '}
                    <span className="font-medium">{step.output}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
