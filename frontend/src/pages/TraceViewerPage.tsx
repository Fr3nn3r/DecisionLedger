import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ErrorState } from '@/components/shared/ErrorState';
import { TraceViewerSkeleton } from '@/components/shared/Skeleton';
import { cn } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, ExternalLink, Route } from 'lucide-react';
import type { TraceStep, DecisionRun } from '@/types';

function StepIndicator({
  step,
  isActive,
  isLast,
  onClick,
}: {
  step: TraceStep;
  isActive: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative flex gap-4">
      {/* Vertical line connector */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-border" />
      )}

      {/* Step circle */}
      <button
        onClick={onClick}
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
          isActive
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted'
        )}
      >
        {step.step_number}
      </button>

      {/* Step summary */}
      <div
        className={cn(
          'flex-1 pb-8 cursor-pointer',
          !isLast && 'border-l-0'
        )}
        onClick={onClick}
      >
        <p
          className={cn(
            'font-medium transition-colors',
            isActive ? 'text-primary' : 'text-foreground hover:text-primary'
          )}
        >
          {step.label}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
          {step.output}
        </p>
      </div>
    </div>
  );
}

function StepDetails({ step }: { step: TraceStep }) {
  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {step.step_number}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{step.label}</h3>
          <p className="text-sm text-muted-foreground">{step.step_id}</p>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Description</p>
        <p>{step.description}</p>
      </div>

      {/* Inputs Used */}
      {step.inputs_used.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Inputs Used</p>
          <div className="flex flex-wrap gap-2">
            {step.inputs_used.map((input) => (
              <span
                key={input}
                className="inline-flex items-center rounded bg-muted px-2 py-1 text-sm font-mono"
              >
                {input}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Output */}
      <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
        <p className="text-sm text-primary uppercase tracking-wide mb-1">Output</p>
        <p className="font-medium">{step.output}</p>
        {step.output_value && (
          <p className="text-sm text-muted-foreground mt-1">
            Value: <span className="font-mono">{step.output_value}</span>
          </p>
        )}
      </div>

      {/* Rule References */}
      {step.rule_refs.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Rule References</p>
          <div className="space-y-1">
            {step.rule_refs.map((rule) => (
              <div
                key={rule}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-mono">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence References */}
      {step.evidence_refs.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Evidence References</p>
          <div className="space-y-2">
            {step.evidence_refs.map((evidence) => (
              <div
                key={evidence}
                className="flex items-center gap-2 text-sm"
              >
                <ExternalLink className="h-4 w-4 text-primary" />
                <span className="font-mono">{evidence}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TraceViewerPage() {
  const { runId } = useParams<{ runId: string }>();
  const { getDecisionRun } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [decisionRun, setDecisionRun] = useState<DecisionRun | undefined>(undefined);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  // Simulate loading delay for realistic UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setDecisionRun(runId ? getDecisionRun(runId) : undefined);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [runId, getDecisionRun]);

  if (isLoading) {
    return <TraceViewerSkeleton />;
  }

  if (!decisionRun) {
    return (
      <ErrorState
        type="not-found"
        title="Trace Not Found"
        message={`The decision run "${runId}" could not be found.`}
        details="Decision runs are stored in memory during your session. They will be lost on page refresh. Run a new decision from the claims page."
        actionLabel="Back to Claims"
        actionHref="/claims"
      />
    );
  }

  const { trace_steps } = decisionRun;
  const selectedStep = trace_steps[selectedStepIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to={`/decision-runs/${runId}`}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Receipt
          </Link>
          <h1 className="text-2xl font-semibold">Trace Viewer</h1>
          <p className="mt-1 text-muted-foreground">
            Run: <span className="font-mono">{runId}</span>
          </p>
        </div>
      </div>

      {/* Determinism Note (S7.3) */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Deterministic Trace:</span>{' '}
          Re-running this decision with the same inputs will produce identical trace steps.
          This trace captures the exact decision flow for audit purposes.
        </p>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left Column: Step List (S7.1) */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            <Route className="h-4 w-4" />
            Decision Steps ({trace_steps.length})
          </h2>
          <div className="space-y-0">
            {trace_steps.map((step, index) => (
              <StepIndicator
                key={step.step_id}
                step={step}
                isActive={index === selectedStepIndex}
                isLast={index === trace_steps.length - 1}
                onClick={() => setSelectedStepIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Step Details (S7.2) */}
        <div className="rounded-lg border border-border bg-card p-6">
          {selectedStep ? (
            <StepDetails step={selectedStep} />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Select a step to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
