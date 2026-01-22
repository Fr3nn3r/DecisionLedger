import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, X, Lightbulb, GitBranch, CircleDot, FileType, FileQuestion } from 'lucide-react';
import { getProposals } from '@/data';
import { GovernanceListSkeleton } from '@/components/shared/Skeleton';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterSelect } from '@/components/shared/FilterSelect';
import { ProposalStatusBadge } from '@/components/shared/badges';
import { formatDate, cn } from '@/lib/utils';
import type { ProposalType, ChangeProposal } from '@/types';

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
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create New Proposal
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search input */}
        <SearchInput
          value={searchFilter}
          onChange={(value) => updateFilter('q', value)}
          placeholder="Search proposals..."
          className="w-56"
        />

        {/* Status dropdown */}
        <FilterSelect
          value={statusFilter}
          onChange={(value) => updateFilter('status', value)}
          options={uniqueStatuses}
          placeholder="All Statuses"
          icon={CircleDot}
        />

        {/* Type dropdown */}
        <FilterSelect
          value={typeFilter}
          onChange={(value) => updateFilter('type', value)}
          options={uniqueTypes}
          placeholder="All Types"
          icon={FileType}
        />

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
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
              <th className="w-10 px-2 py-3"></th>
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
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FileQuestion className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">No proposals match your filters</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Try adjusting your search or{' '}
                        <button onClick={clearFilters} className="text-primary hover:underline">
                          clear filters
                        </button>
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedProposals.map((proposal) => (
                <tr
                  key={proposal.proposal_id}
                  className={cn(
                    'border-b border-border last:border-b-0 hover:bg-muted/50 border-l-4',
                    proposal.status === 'Published' && 'border-l-green-500',
                    proposal.status === 'Approved' && 'border-l-blue-500',
                    proposal.status === 'Pending Approval' && 'border-l-yellow-500',
                    proposal.status === 'Rejected' && 'border-l-red-500',
                    proposal.status === 'Draft' && 'border-l-slate-300 dark:border-l-slate-600'
                  )}
                >
                  <td className="px-2 py-3 text-center">
                    {proposal.proposal_type === 'Interpretation' ? (
                      <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
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
