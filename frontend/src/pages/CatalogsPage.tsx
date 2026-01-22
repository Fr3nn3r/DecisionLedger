import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileEdit, Lightbulb, GitBranch } from 'lucide-react';
import { interpretationSets, assumptionSets } from '@/data';
import { useApp } from '@/context/AppContext';
import { formatDate, cn } from '@/lib/utils';
import type { SetStatus, RiskTier, Role } from '@/types';

// Tab types
type TabId = 'interpretations' | 'assumptions';

// Badge components
function SetStatusBadge({ status }: { status: SetStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'Approved' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        status === 'Draft' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        status === 'Deprecated' && 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      )}
    >
      {status}
    </span>
  );
}

function RiskTierBadge({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tier === 'Low' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        tier === 'Medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        tier === 'High' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      )}
    >
      {tier}
    </span>
  );
}

// Chevron icon component
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={cn(
        'h-4 w-4 text-muted-foreground transition-transform',
        expanded && 'rotate-90'
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// Check if role can draft proposals
function canDraftProposal(role: Role): boolean {
  return role === 'Policy Owner' || role === 'QA Lead';
}

export function CatalogsPage() {
  const { currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('interpretations');
  const [expandedInterpretations, setExpandedInterpretations] = useState<Set<string>>(new Set());
  const [expandedAssumptions, setExpandedAssumptions] = useState<Set<string>>(new Set());

  const toggleInterpretation = (id: string) => {
    setExpandedInterpretations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAssumption = (id: string) => {
    setExpandedAssumptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Catalogs</h1>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-border">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('interpretations')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'interpretations'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            )}
          >
            Interpretations
          </button>
          <button
            onClick={() => setActiveTab('assumptions')}
            className={cn(
              'py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'assumptions'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            )}
          >
            Assumptions
          </button>
        </nav>
      </div>

      {/* Interpretations Tab */}
      {activeTab === 'interpretations' && (
        <div className="space-y-6">
          {interpretationSets.map((set) => (
            <div key={set.interpretation_set_id} className="overflow-hidden rounded-lg border border-border">
              {/* Set Header */}
              <div className="bg-muted px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{set.interpretation_set_id}</span>
                    <span className="text-sm text-muted-foreground">v{set.version}</span>
                    <SetStatusBadge status={set.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Effective: {formatDate(set.effective_from)}</span>
                    <span>{set.jurisdiction} / {set.product_line}</span>
                  </div>
                </div>
              </div>

              {/* Decision Points Table */}
              <table className="w-full">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="w-8 px-4 py-2"></th>
                    <th className="w-10 px-2 py-2"></th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Decision Point</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Default</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Options</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Owner</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                    {canDraftProposal(currentRole) && (
                      <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {set.decision_points.map((dp) => {
                    const isExpanded = expandedInterpretations.has(dp.decision_point_id);
                    const defaultOption = dp.options.find((o) => o.option_id === dp.default_option);

                    return (
                      <>
                        <tr
                          key={dp.decision_point_id}
                          className="border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleInterpretation(dp.decision_point_id)}
                        >
                          <td className="px-4 py-3">
                            <ChevronIcon expanded={isExpanded} />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <Lightbulb className="h-4 w-4 text-muted-foreground" />
                          </td>
                          <td className="px-4 py-3 font-medium">{dp.label}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                              {defaultOption?.label || dp.default_option}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {dp.options.length} options
                          </td>
                          <td className="px-4 py-3 text-sm">{dp.owner}</td>
                          <td className="px-4 py-3">
                            <SetStatusBadge status={dp.status} />
                          </td>
                          {canDraftProposal(currentRole) && (
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <Link
                                to={`/governance?type=interpretation&ref=${dp.decision_point_id}`}
                                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                              >
                                <FileEdit className="h-3 w-3" />
                                Draft Proposal
                              </Link>
                            </td>
                          )}
                        </tr>
                        {isExpanded && (
                          <tr key={`${dp.decision_point_id}-expanded`} className="border-b border-border last:border-b-0">
                            <td colSpan={canDraftProposal(currentRole) ? 8 : 7} className="bg-muted/30 px-4 py-4">
                              <div className="ml-8 space-y-4">
                                <p className="text-sm text-muted-foreground">{dp.description}</p>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Available Options:</h4>
                                  <div className="grid gap-2">
                                    {dp.options.map((option) => (
                                      <div
                                        key={option.option_id}
                                        className={cn(
                                          'rounded-md border p-3',
                                          option.option_id === dp.default_option
                                            ? 'border-primary/50 bg-primary/5'
                                            : 'border-border bg-card'
                                        )}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{option.label}</span>
                                          {option.option_id === dp.default_option && (
                                            <span className="text-xs text-primary">(default)</span>
                                          )}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Assumptions Tab */}
      {activeTab === 'assumptions' && (
        <div className="space-y-6">
          {assumptionSets.map((set) => (
            <div key={set.assumption_set_id} className="overflow-hidden rounded-lg border border-border">
              {/* Set Header */}
              <div className="bg-muted px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{set.assumption_set_id}</span>
                    <span className="text-sm text-muted-foreground">v{set.version}</span>
                    <SetStatusBadge status={set.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{set.jurisdiction} / {set.product_line}</span>
                  </div>
                </div>
              </div>

              {/* Assumptions Table */}
              <table className="w-full">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="w-8 px-4 py-2"></th>
                    <th className="w-10 px-2 py-2"></th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Assumption</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Trigger</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Risk Tier</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Recommended</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Alternatives</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                    {canDraftProposal(currentRole) && (
                      <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {set.assumptions.map((assumption) => {
                    const isExpanded = expandedAssumptions.has(assumption.assumption_id);
                    const recommendedAlt = assumption.alternatives.find(
                      (a) => a.alternative_id === assumption.recommended_resolution
                    );

                    return (
                      <>
                        <tr
                          key={assumption.assumption_id}
                          className="border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleAssumption(assumption.assumption_id)}
                        >
                          <td className="px-4 py-3">
                            <ChevronIcon expanded={isExpanded} />
                          </td>
                          <td className="px-2 py-3 text-center">
                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                          </td>
                          <td className="px-4 py-3 font-medium">{assumption.label}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                            {assumption.trigger}
                          </td>
                          <td className="px-4 py-3">
                            <RiskTierBadge tier={assumption.risk_tier} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                              {recommendedAlt?.label || assumption.recommended_resolution}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {assumption.alternatives.length} alternatives
                          </td>
                          <td className="px-4 py-3">
                            <SetStatusBadge status={set.status} />
                          </td>
                          {canDraftProposal(currentRole) && (
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <Link
                                to={`/governance?type=assumption&ref=${assumption.assumption_id}`}
                                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                              >
                                <FileEdit className="h-3 w-3" />
                                Draft Proposal
                              </Link>
                            </td>
                          )}
                        </tr>
                        {isExpanded && (
                          <tr key={`${assumption.assumption_id}-expanded`} className="border-b border-border last:border-b-0">
                            <td colSpan={canDraftProposal(currentRole) ? 9 : 8} className="bg-muted/30 px-4 py-4">
                              <div className="ml-8 space-y-4">
                                <p className="text-sm text-muted-foreground">{assumption.description}</p>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Resolution Alternatives:</h4>
                                  <div className="grid gap-2">
                                    {assumption.alternatives.map((alt) => (
                                      <div
                                        key={alt.alternative_id}
                                        className={cn(
                                          'rounded-md border p-3',
                                          alt.alternative_id === assumption.recommended_resolution
                                            ? 'border-primary/50 bg-primary/5'
                                            : 'border-border bg-card'
                                        )}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-sm">{alt.label}</span>
                                          {alt.alternative_id === assumption.recommended_resolution && (
                                            <span className="text-xs text-primary">(Recommended)</span>
                                          )}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{alt.description}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {alt.allowed_roles.map((role) => (
                                            <span
                                              key={role}
                                              className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                                            >
                                              {role}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
