import { Link } from 'react-router-dom';
import { getClaimSummaries } from '@/data';
import { formatDate, cn } from '@/lib/utils';
import type { ClaimStatus } from '@/types';

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

export function ClaimsListPage() {
  const claims = getClaimSummaries();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Claims</h1>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Claim ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Loss Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {claims.map((claim) => (
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
