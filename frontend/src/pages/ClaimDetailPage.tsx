import { useParams } from 'react-router-dom';

export function ClaimDetailPage() {
  const { claimId } = useParams<{ claimId: string }>();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Claim: {claimId}</h1>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Claim detail will be implemented here.
      </div>
    </div>
  );
}
