import { useParams } from 'react-router-dom';

export function TraceViewerPage() {
  const { runId } = useParams<{ runId: string }>();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Trace Viewer</h1>
      <p className="mb-4 text-muted-foreground">Trace for run: {runId}</p>
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Trace viewer will be implemented here.
      </div>
    </div>
  );
}
