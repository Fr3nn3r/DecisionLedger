import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getClaimSummaries } from '@/data';
import { ClaimsListSkeleton } from '@/components/shared/Skeleton';
import { formatDate, cn } from '@/lib/utils';
import type { ClaimStatus, ClaimSummary } from '@/types';

// Filter param keys for URL search params
const FILTER_KEYS = {
  jurisdiction: 'jurisdiction',
  productLine: 'product',
  search: 'q',
} as const;

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

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'Ready'
          ? 'bg-secondary text-secondary-foreground'
          : 'bg-primary text-primary-foreground'
      )}
    >
      {status}
    </span>
  );
}

type ClaimSortKey = 'claim_id' | 'product_line' | 'loss_date' | 'status';

export function ClaimsListPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimSummary[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortConfig, setSortConfig] = useState<SortConfig<ClaimSortKey> | null>(null);

  // Simulate initial data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setClaims(getClaimSummaries());
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Get filter values from URL search params
  const jurisdictionFilter = searchParams.get(FILTER_KEYS.jurisdiction) || '';
  const productLineFilter = searchParams.get(FILTER_KEYS.productLine) || '';
  const searchFilter = searchParams.get(FILTER_KEYS.search) || '';

  // Get unique values for dropdown options
  const uniqueJurisdictions = useMemo(
    () => [...new Set(claims.map((c) => c.jurisdiction))].sort(),
    [claims]
  );
  const uniqueProductLines = useMemo(
    () => [...new Set(claims.map((c) => c.product_line))].sort(),
    [claims]
  );

  // Check if any filters are active
  const hasActiveFilters = jurisdictionFilter || productLineFilter || searchFilter;

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
  const filteredAndSortedClaims = useMemo(() => {
    let result = claims;

    // Apply jurisdiction filter
    if (jurisdictionFilter) {
      result = result.filter((c) => c.jurisdiction === jurisdictionFilter);
    }

    // Apply product line filter
    if (productLineFilter) {
      result = result.filter((c) => c.product_line === productLineFilter);
    }

    // Apply search filter (case-insensitive)
    if (searchFilter) {
      const searchLower = searchFilter.toLowerCase();
      result = result.filter((c) => c.claim_id.toLowerCase().includes(searchLower));
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
  }, [claims, jurisdictionFilter, productLineFilter, searchFilter, sortConfig]);

  const requestSort = (key: ClaimSortKey) => {
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
    return <ClaimsListSkeleton />;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Claims</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search claim ID..."
            value={searchFilter}
            onChange={(e) => updateFilter(FILTER_KEYS.search, e.target.value)}
            className="h-9 w-48 rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Jurisdiction dropdown */}
        <select
          value={jurisdictionFilter}
          onChange={(e) => updateFilter(FILTER_KEYS.jurisdiction, e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Jurisdictions</option>
          {uniqueJurisdictions.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>

        {/* Product line dropdown */}
        <select
          value={productLineFilter}
          onChange={(e) => updateFilter(FILTER_KEYS.productLine, e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Products</option>
          {uniqueProductLines.map((p) => (
            <option key={p} value={p}>
              {p}
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
          {filteredAndSortedClaims.length} of {claims.length} claims
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <SortableHeader
                label="Claim ID"
                sortKey="claim_id"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Product"
                sortKey="product_line"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Loss Date"
                sortKey="loss_date"
                currentSort={sortConfig}
                onSort={requestSort}
              />
              <SortableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onSort={requestSort}
              />
            </tr>
          </thead>
          <tbody className="bg-card">
            {filteredAndSortedClaims.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No claims match your filters.{' '}
                  <button
                    onClick={clearFilters}
                    className="text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              filteredAndSortedClaims.map((claim) => (
                <tr
                  key={claim.claim_id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/claims/${claim.claim_id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {claim.claim_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{claim.product_line}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(claim.loss_date)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={claim.status} />
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
