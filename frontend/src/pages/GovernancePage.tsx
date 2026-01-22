import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProposals } from '@/data';
import { GovernanceListSkeleton } from '@/components/shared/Skeleton';
import { formatDate, cn } from '@/lib/utils';
import type { ProposalStatus, ProposalType, ChangeProposal } from '@/types';

type SortDirection = 'asc' | 'desc';

interface SortConfig<T extends string> {
  key: T;
  direction: SortDirection;
}

function SortableHeader<T extends string>({
  label,
  sortKey,
  currentSort,
  onSort,
  className,
}: {
  label: string;
  sortKey: T;
  currentSort: SortConfig<T> | null;
  onSort: (key: T) => void;
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

function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const colorClasses: Record<ProposalStatus, string> = {
    Draft: 'bg-secondary text-secondary-foreground',
    'Pending Approval': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClasses[status]
      )}
    >
      {status}
    </span>
  );
}

function ProposalTypeBadge({ type }: { type: ProposalType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        type === 'Interpretation'
          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
      )}
    >
      {type}
    </span>
  );
}

type ProposalSortKey = 'title' | 'proposal_type' | 'status' | 'created_at';

export function GovernancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [proposals, setProposals] = useState<ChangeProposal[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortConfig, setSortConfig] = useState<SortConfig<ProposalSortKey> | null>({
    key: 'created_at',
    direction: 'desc',
  });

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setProposals(getProposals());
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Get filter values from URL search params
  const statusFilter = searchParams.get('status') || '';
  const typeFilter = searchParams.get('type') || '';
  const searchFilter = searchParams.get('q') || '';

  // Get unique values for dropdown options
  const uniqueStatuses = useMemo(
    () => [...new Set(proposals.map((p) => p.status))].sort(),
    [proposals]
  );
  const uniqueTypes = useMemo(
    () => [...new Set(proposals.map((p) => p.proposal_type))].sort(),
    [proposals]
  );

  // Check if any filters are active
  const hasActiveFilters = statusFilter || typeFilter || searchFilter;

  // Update filter in URL params
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

  // Clear all filters
  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Apply filters then sort
  const filteredAndSortedProposals = useMemo(() => {
    let result = proposals;

    // Apply status filter
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter) {
      result = result.filter((p) => p.proposal_type === typeFilter);
    }

    // Apply search filter (case-insensitive on title)
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.proposal_id.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const modifier = sortConfig.direction === 'asc' ? 1 : -1;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      });
    }

    return result;
  }, [proposals, statusFilter, typeFilter, searchFilter, sortConfig]);

  const requestSort = (key: ProposalSortKey) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  if (isLoading) {
    return <GovernanceListSkeleton />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Governance</h1>
        <Link
          to="/governance/new"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Create New Proposal
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchFilter}
            onChange={(e) => updateFilter('q', e.target.value)}
            className="h-9 w-56 rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Type dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

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
          {filteredAndSortedProposals.length} of {proposals.length} proposals
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <SortableHeader
                label="Title"
                sortKey="title"
                currentSort={sortConfig}
                onSort={requestSort}
                className="min-w-[300px]"
              />
              <SortableHeader
                label="Type"
                sortKey="proposal_type"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Created"
                sortKey="created_at"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <th className="px-4 py-3 text-left text-sm font-medium">Created By</th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {filteredAndSortedProposals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No proposals match your filters.{' '}
                  <button onClick={clearFilters} className="text-primary hover:underline">
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredAndSortedProposals.map((proposal) => (
                <tr
                  key={proposal.proposal_id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/governance/${proposal.proposal_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {proposal.title}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {proposal.proposal_id}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ProposalTypeBadge type={proposal.proposal_type} />
                  </td>
                  <td className="px-4 py-3">
                    <ProposalStatusBadge status={proposal.status} />
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(proposal.created_at)}</td>
                  <td className="px-4 py-3 text-sm">{proposal.created_by}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
