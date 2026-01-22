import { useParams } from 'react-router-dom';

export function CounterfactualPage() {
  const { runId } = useParams<{ runId: string }>();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Counterfactual Simulator</h1>
      <p className="mb-4 text-muted-foreground">Base run: {runId}</p>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Counterfactual simulator will be implemented here.
      </div>
    </div>
  );
}
