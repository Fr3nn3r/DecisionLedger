import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { formatCHF, formatDateTime, cn } from '@/lib/utils';
import type { DecisionStatus } from '@/types';

const FILTER_KEYS = {
  search: 'q',
} as const;

type SortDirection = 'asc' | 'desc';
type RunSortKey = 'run_id' | 'claim_id' | 'timestamp' | 'status' | 'payout_total';

interface SortConfig {
  key: RunSortKey;
  direction: SortDirection;
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
}: {
  label: string;
  sortKey: RunSortKey;
  currentSort: SortConfig | null;
  onSort: (key: RunSortKey) => void;
  className?: string;
}) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-sm font-medium cursor-pointer select-none hover:bg-muted/50 transition-colors',
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="text-muted-foreground/50">
          {direction === 'asc' && '▲'}
          {direction === 'desc' && '▼'}
          {!direction && '⇅'}
        </span>
      </span>
    </th>
  );
}

function OutcomeBadge({ status }: { status: DecisionStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'Approved' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        status === 'Partial' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        status === 'Denied' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      )}
    >
      {status}
    </span>
  );
}

export function DecisionRunsPage() {
  const { decisionRuns } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  // Default sort: newest first by timestamp
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'timestamp',
    direction: 'desc',
  });

  const searchFilter = searchParams.get(FILTER_KEYS.search) || '';

  const hasActiveFilters = !!searchFilter;

  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const filteredAndSortedRuns = useMemo(() => {
    let result = [...decisionRuns];

    // Apply search filter (case-insensitive, matches run_id or claim_id)
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      result = result.filter(
        (r) =>
          r.run_id.toLowerCase().includes(searchLower) ||
          r.claim_id.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const modifier = sortConfig.direction === 'asc' ? 1 : -1;
        let aVal: string | number;
        let bVal: string | number;

        switch (sortConfig.key) {
          case 'status':
            aVal = a.outcome.status;
            bVal = b.outcome.status;
            break;
          case 'payout_total':
            aVal = a.outcome.payout_total;
            bVal = b.outcome.payout_total;
            break;
          default:
            aVal = a[sortConfig.key];
            bVal = b[sortConfig.key];
        }

        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      });
    }

    return result;
  }, [decisionRuns, searchFilter, sortConfig]);

  const requestSort = (key: RunSortKey) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        // Reset to default (newest first) when cycling through
        return { key: 'timestamp', direction: 'desc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Empty state when no decisions exist at all
  if (decisionRuns.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Decision Runs</h1>
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-lg font-medium">No decision runs yet</h2>
          <p className="mb-4 text-muted-foreground">
            Decision runs will appear here once you process claims through the Decision Wizard.
          </p>
          <Link
            to="/claims"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Claims
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Decision Runs</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search run ID or claim ID..."
            value={searchFilter}
            onChange={(e) => updateFilter(FILTER_KEYS.search, e.target.value)}
            className="h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-muted transition-colors"
          >
            Clear filters
          </button>
        )}

        {/* Results count */}
        <span className="ml-auto text-sm text-muted-foreground">
          {filteredAndSortedRuns.length} of {decisionRuns.length} decision runs
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <SortableHeader
                label="Run ID"
                sortKey="run_id"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Claim ID"
                sortKey="claim_id"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Timestamp"
                sortKey="timestamp"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Outcome"
                sortKey="status"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Payout"
                sortKey="payout_total"
                currentSort={sortConfig}
                onSort={requestSort}
                className="text-right"
              />
            </tr>
          </thead>
          <tbody className="bg-card">
            {filteredAndSortedRuns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No decision runs match your search.{' '}
                  <button onClick={clearFilters} className="text-primary hover:underline">
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredAndSortedRuns.map((run) => (
                <tr
                  key={run.run_id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/decision-runs/${run.run_id}`}
                      className="font-medium text-primary hover:underline font-mono text-sm"
                    >
                      {run.run_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/claims/${run.claim_id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {run.claim_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDateTime(run.timestamp)}</td>
                  <td className="px-4 py-3">
                    <OutcomeBadge status={run.outcome.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCHF(run.outcome.payout_total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
