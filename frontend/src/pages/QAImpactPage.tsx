import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { qaCohorts, qaProposedChanges, getQAStudyResult } from '@/data';
import { formatCHF, cn } from '@/lib/utils';
import type { QACohort, QAProposedChange, QAStudyResult, QAFlag, ImpactedClaim } from '@/types';

function DeltaBadge({ delta, size = 'default' }: { delta: number; size?: 'default' | 'large' }) {
  const baseClasses = size === 'large' ? 'text-2xl font-bold' : 'text-sm font-medium';

  if (delta === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-muted-foreground', baseClasses)}>
        <Minus className={size === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
        No change
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-green-600 dark:text-green-400', baseClasses)}>
        <ArrowUpRight className={size === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
        +{formatCHF(delta)}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-red-600 dark:text-red-400', baseClasses)}>
      <ArrowDownRight className={size === 'large' ? 'h-5 w-5' : 'h-4 w-4'} />
      {formatCHF(delta)}
    </span>
  );
}

function FlagBadge({ flag }: { flag: QAFlag }) {
  const configs: Record<QAFlag, { label: string; className: string; icon: typeof AlertTriangle }> = {
    INCONSISTENCY_DETECTED: {
      label: 'Inconsistency Detected',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
    },
    HIGH_IMPACT: {
      label: 'High Impact',
      className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800',
      icon: AlertCircle,
    },
    LOW_CONFIDENCE: {
      label: 'Low Confidence',
      className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
      icon: AlertCircle,
    },
  };

  const config = configs[flag];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

// S9.1: Cohort and Proposal Selectors
function SelectorsPanel({
  selectedCohort,
  selectedProposal,
  onCohortChange,
  onProposalChange,
  onRunSimulation,
  isLoading,
}: {
  selectedCohort: string;
  selectedProposal: string;
  onCohortChange: (cohortId: string) => void;
  onProposalChange: (proposalId: string) => void;
  onRunSimulation: () => void;
  isLoading: boolean;
}) {
  const canRun = selectedCohort && selectedProposal;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Configure Simulation</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Select a claim cohort and proposed policy change to analyze the potential impact across your portfolio.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cohort Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Claim Cohort</label>
          <select
            value={selectedCohort}
            onChange={(e) => onCohortChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Select a cohort --</option>
            {qaCohorts.map((cohort) => (
              <option key={cohort.cohort_id} value={cohort.cohort_id}>
                {cohort.label} ({cohort.claim_count} claims)
              </option>
            ))}
          </select>
          {selectedCohort && (
            <p className="mt-2 text-xs text-muted-foreground">
              {qaCohorts.find((c) => c.cohort_id === selectedCohort)?.description}
            </p>
          )}
        </div>

        {/* Proposal Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Proposed Change</label>
          <select
            value={selectedProposal}
            onChange={(e) => onProposalChange(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Select a proposed change --</option>
            {qaProposedChanges.map((proposal) => (
              <option key={proposal.proposal_id} value={proposal.proposal_id}>
                {proposal.label}
              </option>
            ))}
          </select>
          {selectedProposal && (
            <p className="mt-2 text-xs text-muted-foreground">
              {qaProposedChanges.find((p) => p.proposal_id === selectedProposal)?.description}
            </p>
          )}
        </div>
      </div>

      {/* Run Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onRunSimulation}
          disabled={!canRun || isLoading}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
            canRun && !isLoading
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running Simulation...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4" />
              Run QA Simulation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// S9.2: Results Dashboard
function ResultsDashboard({ result }: { result: QAStudyResult }) {
  const deltaDirection = result.total_delta_payout > 0 ? 'increase' : result.total_delta_payout < 0 ? 'decrease' : 'no change';

  return (
    <div className="space-y-6">
      {/* Headline Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Impacted Claims */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Impacted Claims</p>
              <p className="mt-2 text-3xl font-bold">{result.impacted_claims_count}</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            out of {qaCohorts.find((c) => c.cohort_id === result.cohort_id)?.claim_count || '?'} in cohort
          </p>
        </div>

        {/* Total Delta */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Delta Payout</p>
              <div className="mt-2">
                <DeltaBadge delta={result.total_delta_payout} size="large" />
              </div>
            </div>
            <div className={cn(
              'rounded-full p-3',
              deltaDirection === 'increase' ? 'bg-green-100 dark:bg-green-900/30' :
              deltaDirection === 'decrease' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-muted'
            )}>
              {deltaDirection === 'increase' ? (
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : deltaDirection === 'decrease' ? (
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <Minus className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {deltaDirection === 'increase' ? 'Additional payout if change applied' :
             deltaDirection === 'decrease' ? 'Reduced payout if change applied' :
             'No payout impact'}
          </p>
        </div>

        {/* Study Info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Study ID</p>
              <p className="mt-2 font-mono text-sm">{result.study_id}</p>
            </div>
            <div className="rounded-full bg-muted p-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Run: {new Date(result.run_date).toLocaleDateString('de-CH')}
          </p>
        </div>
      </div>

      {/* Flags / Warnings */}
      {result.flags.length > 0 && (
        <div className={cn(
          'rounded-lg border p-4',
          result.flags.includes('INCONSISTENCY_DETECTED')
            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20'
            : result.flags.includes('HIGH_IMPACT')
            ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
            : 'border-border bg-muted/30'
        )}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn(
              'h-5 w-5 mt-0.5 flex-shrink-0',
              result.flags.includes('INCONSISTENCY_DETECTED')
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            )} />
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {result.flags.map((flag) => (
                  <FlagBadge key={flag} flag={flag} />
                ))}
              </div>
              {result.inconsistency_detail && (
                <p className="text-sm text-muted-foreground">{result.inconsistency_detail}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-2">Analysis Summary</h3>
        <p className="text-sm text-muted-foreground">{result.summary}</p>
      </div>
    </div>
  );
}

// S9.3: Top Impacted Claims List
function ImpactedClaimsList({ claims, showAll = false }: { claims: ImpactedClaim[]; showAll?: boolean }) {
  // Sort by absolute delta (highest impact first)
  const sortedClaims = [...claims].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const displayClaims = showAll ? sortedClaims : sortedClaims.slice(0, 5);
  const hasMore = !showAll && sortedClaims.length > 5;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="font-semibold">Top Impacted Claims</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Claims sorted by impact magnitude (highest first)
        </p>
      </div>

      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-6 py-3 text-left font-medium">Claim ID</th>
              <th className="px-6 py-3 text-right font-medium">Delta</th>
              <th className="px-6 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayClaims.map((claim) => (
              <tr key={claim.claim_id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <Link
                    to={`/claims/${claim.claim_id}`}
                    className="font-mono text-primary hover:underline"
                  >
                    {claim.claim_id}
                  </Link>
                </td>
                <td className="px-6 py-4 text-right">
                  <DeltaBadge delta={claim.delta} />
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    to={`/claims/${claim.claim_id}`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    View Claim
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="border-t border-border px-6 py-3 text-center">
          <button className="text-sm text-primary hover:underline">
            View all {sortedClaims.length} impacted claims
          </button>
        </div>
      )}

      {displayClaims.length === 0 && (
        <div className="px-6 py-8 text-center text-muted-foreground">
          No claims impacted by this change.
        </div>
      )}
    </div>
  );
}

export function QAImpactPage() {
  const [selectedCohort, setSelectedCohort] = useState('');
  const [selectedProposal, setSelectedProposal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QAStudyResult | null>(null);

  const handleRunSimulation = () => {
    if (!selectedCohort || !selectedProposal) return;

    // Simulate loading state
    setIsLoading(true);
    setResult(null);

    // Brief delay to show loading state, then fetch pre-computed result
    setTimeout(() => {
      const studyResult = getQAStudyResult(selectedCohort, selectedProposal);
      setResult(studyResult || null);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">QA Impact Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Simulate the portfolio-wide impact of proposed policy changes before implementation.
        </p>
      </div>

      {/* S9.1: Selectors */}
      <SelectorsPanel
        selectedCohort={selectedCohort}
        selectedProposal={selectedProposal}
        onCohortChange={setSelectedCohort}
        onProposalChange={setSelectedProposal}
        onRunSimulation={handleRunSimulation}
        isLoading={isLoading}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Running QA simulation across cohort...</p>
        </div>
      )}

      {/* No Result Found */}
      {!isLoading && result === null && selectedCohort && selectedProposal && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No pre-computed study found for this cohort and proposal combination.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Try a different combination or contact QA Lead to run a new study.
          </p>
        </div>
      )}

      {/* S9.2 & S9.3: Results */}
      {!isLoading && result && (
        <>
          <ResultsDashboard result={result} />
          <ImpactedClaimsList claims={result.top_impacted_claims} />

          {/* S9.4 placeholder: Create Proposal action */}
          <div className="flex justify-end">
            <Link
              to={`/governance?proposal=${result.proposal_id}&cohort=${result.cohort_id}`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              Create Change Proposal
            </Link>
          </div>
        </>
      )}

      {/* Empty state before selection */}
      {!isLoading && !result && !selectedCohort && !selectedProposal && (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Select a cohort and proposed change above to run a QA impact simulation.
          </p>
        </div>
      )}
    </div>
  );
}
