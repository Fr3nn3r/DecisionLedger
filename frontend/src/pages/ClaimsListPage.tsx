import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getClaimSummaries } from '@/data';
import { formatDate, cn } from '@/lib/utils';
import type { ClaimStatus, ClaimSummary } from '@/types';

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
  const claims = getClaimSummaries();
  const [sortConfig, setSortConfig] = useState<SortConfig<ClaimSortKey> | null>(null);

  const sortedClaims = useMemo(() => {
    if (!sortConfig) return claims;

    return [...claims].sort((a, b) => {
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return -1 * modifier;
      if (aVal > bVal) return 1 * modifier;
      return 0;
    });
  }, [claims, sortConfig]);

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

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Claims</h1>
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
            {sortedClaims.map((claim) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
