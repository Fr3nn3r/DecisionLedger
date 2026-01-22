import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getClaimById } from '@/data';
import { formatDate, formatCHF, cn } from '@/lib/utils';
import type { Fact, Evidence, LineItem, FactStatus } from '@/types';

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

function FactStatusBadge({ status }: { status: FactStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'KNOWN'
          ? 'bg-secondary text-secondary-foreground'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      )}
    >
      {status}
    </span>
  );
}

function useSortableData<T, K extends string>(
  data: T[],
  getComparator: (key: K, direction: SortDirection) => (a: T, b: T) => number
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<K> | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    const sorted = [...data].sort(getComparator(sortConfig.key, sortConfig.direction));
    return sorted;
  }, [data, sortConfig, getComparator]);

  const requestSort = (key: K) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null; // Reset sort
      }
      return { key, direction: 'asc' };
    });
  };

  return { sortedData, sortConfig, requestSort };
}

type FactSortKey = 'label' | 'value' | 'status' | 'source';
type EvidenceSortKey = 'label' | 'type';
type LineItemSortKey = 'label' | 'category' | 'amount_chf';

export function ClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();
  const claim = claimId ? getClaimById(claimId) : undefined;

  const factComparator = useMemo(
    () => (key: FactSortKey, direction: SortDirection) => (a: Fact, b: Fact) => {
      const modifier = direction === 'asc' ? 1 : -1;
      const aVal = a[key] ?? '';
      const bVal = b[key] ?? '';
      if (aVal < bVal) return -1 * modifier;
      if (aVal > bVal) return 1 * modifier;
      return 0;
    },
    []
  );

  const evidenceComparator = useMemo(
    () => (key: EvidenceSortKey, direction: SortDirection) => (a: Evidence, b: Evidence) => {
      const modifier = direction === 'asc' ? 1 : -1;
      if (a[key] < b[key]) return -1 * modifier;
      if (a[key] > b[key]) return 1 * modifier;
      return 0;
    },
    []
  );

  const lineItemComparator = useMemo(
    () => (key: LineItemSortKey, direction: SortDirection) => (a: LineItem, b: LineItem) => {
      const modifier = direction === 'asc' ? 1 : -1;
      if (a[key] < b[key]) return -1 * modifier;
      if (a[key] > b[key]) return 1 * modifier;
      return 0;
    },
    []
  );

  const {
    sortedData: sortedFacts,
    sortConfig: factSortConfig,
    requestSort: requestFactSort,
  } = useSortableData<Fact, FactSortKey>(claim?.facts ?? [], factComparator);

  const {
    sortedData: sortedEvidence,
    sortConfig: evidenceSortConfig,
    requestSort: requestEvidenceSort,
  } = useSortableData<Evidence, EvidenceSortKey>(claim?.evidence ?? [], evidenceComparator);

  const {
    sortedData: sortedLineItems,
    sortConfig: lineItemSortConfig,
    requestSort: requestLineItemSort,
  } = useSortableData<LineItem, LineItemSortKey>(claim?.line_items ?? [], lineItemComparator);

  if (!claim) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-semibold">Claim Not Found</h1>
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          <p className="mb-4">The claim "{claimId}" could not be found.</p>
          <Link to="/claims" className="text-primary hover:underline">
            Return to Claims List
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = claim.line_items.reduce((sum, item) => sum + item.amount_chf, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{claim.claim_id}</h1>
          <p className="mt-1 text-muted-foreground">
            {claim.jurisdiction} · {claim.product_line}
          </p>
        </div>
        <Link
          to={`/claims/${claim.claim_id}/decision`}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Run Decision
        </Link>
      </div>

      {/* Claim Info Card */}
      <div className="rounded-lg border border-border bg-card p-4">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-muted-foreground">Policy ID</dt>
            <dd className="mt-1 font-medium">{claim.policy_id}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Loss Date</dt>
            <dd className="mt-1 font-medium">{formatDate(claim.loss_date)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd className="mt-1 font-medium">{claim.status}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Total Claimed</dt>
            <dd className="mt-1 font-medium">{formatCHF(totalAmount)}</dd>
          </div>
        </dl>
      </div>

      {/* Facts Section */}
      <div>
        <h2 className="mb-3 text-lg font-medium">Facts</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <SortableHeader
                  label="Label"
                  sortKey="label"
                  currentSort={factSortConfig}
                  onSort={requestFactSort}
                />
                <SortableHeader
                  label="Value"
                  sortKey="value"
                  currentSort={factSortConfig}
                  onSort={requestFactSort}
                />
                <SortableHeader
                  label="Status"
                  sortKey="status"
                  currentSort={factSortConfig}
                  onSort={requestFactSort}
                />
                <SortableHeader
                  label="Source"
                  sortKey="source"
                  currentSort={factSortConfig}
                  onSort={requestFactSort}
                />
              </tr>
            </thead>
            <tbody className="bg-card">
              {sortedFacts.map((fact) => (
                <tr
                  key={fact.fact_id}
                  className={cn(
                    'border-b border-border last:border-b-0',
                    fact.status === 'UNKNOWN' && 'bg-yellow-50 dark:bg-yellow-950/20'
                  )}
                >
                  <td className="px-4 py-3 text-sm font-medium">{fact.label}</td>
                  <td className="px-4 py-3 text-sm">
                    {fact.value ?? <span className="italic text-muted-foreground">Unknown</span>}
                  </td>
                  <td className="px-4 py-3">
                    <FactStatusBadge status={fact.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{fact.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evidence Section */}
      <div>
        <h2 className="mb-3 text-lg font-medium">Evidence</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <SortableHeader
                  label="Document"
                  sortKey="label"
                  currentSort={evidenceSortConfig}
                  onSort={requestEvidenceSort}
                />
                <SortableHeader
                  label="Type"
                  sortKey="type"
                  currentSort={evidenceSortConfig}
                  onSort={requestEvidenceSort}
                />
                <th className="px-4 py-3 text-left text-sm font-medium">Link</th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {sortedEvidence.map((ev) => (
                <tr key={ev.evidence_id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium">{ev.label}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{ev.type}</td>
                  <td className="px-4 py-3 text-sm">
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Items Section */}
      <div>
        <h2 className="mb-3 text-lg font-medium">Line Items</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <SortableHeader
                  label="Item"
                  sortKey="label"
                  currentSort={lineItemSortConfig}
                  onSort={requestLineItemSort}
                />
                <SortableHeader
                  label="Category"
                  sortKey="category"
                  currentSort={lineItemSortConfig}
                  onSort={requestLineItemSort}
                />
                <SortableHeader
                  label="Amount"
                  sortKey="amount_chf"
                  currentSort={lineItemSortConfig}
                  onSort={requestLineItemSort}
                  className="text-right"
                />
              </tr>
            </thead>
            <tbody className="bg-card">
              {sortedLineItems.map((item) => (
                <tr key={item.item_id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium">{item.label}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        item.category === 'accessory'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{formatCHF(item.amount_chf)}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-muted/50 font-medium">
                <td className="px-4 py-3 text-sm" colSpan={2}>
                  Total
                </td>
                <td className="px-4 py-3 text-right text-sm">{formatCHF(totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
