import { useParams } from 'react-router-dom';

export function ProposalDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Proposal Detail</h1>
      <p className="mb-4 text-muted-foreground">Proposal ID: {proposalId}</p>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Proposal detail will be implemented here.
      </div>
    </div>
  );
}
