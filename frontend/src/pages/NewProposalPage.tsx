import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FileText, CheckCircle, Circle, ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { qaProposedChanges, qaCohorts, getQAStudyResult } from '@/data';
import { formatCHF, cn } from '@/lib/utils';
import type { ProposalType, QAStudyResult, QAProposedChange } from '@/types';

interface ApprovalStepDisplay {
  name: string;
  role: string;
  status: 'pending' | 'current' | 'completed';
}

const DEFAULT_APPROVAL_STEPS: ApprovalStepDisplay[] = [
  { name: 'Claims Ops Review', role: 'Supervisor', status: 'pending' },
  { name: 'Legal Review', role: 'Policy Owner', status: 'pending' },
  { name: 'Final Approval', role: 'Policy Owner', status: 'pending' },
];

function ApprovalWorkflow({ steps }: { steps: ApprovalStepDisplay[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-semibold mb-4">Approval Workflow</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This proposal will require the following approvals before it can be published.
      </p>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            {step.status === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">{step.name}</p>
              <p className="text-xs text-muted-foreground">Required: {step.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QAImpactSummary({ result }: { result: QAStudyResult }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
        QA Impact Summary
      </h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Cohort</p>
          <p className="font-medium">{result.cohort_label}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Impacted Claims</p>
          <p className="font-medium">{result.impacted_claims_count}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Delta</p>
          <p className={cn(
            'font-medium',
            result.total_delta_payout > 0 ? 'text-green-600 dark:text-green-400' :
            result.total_delta_payout < 0 ? 'text-red-600 dark:text-red-400' :
            'text-muted-foreground'
          )}>
            {result.total_delta_payout > 0 ? '+' : ''}{formatCHF(result.total_delta_payout)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Study ID</p>
          <p className="font-mono text-xs">{result.study_id}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{result.summary}</p>
    </div>
  );
}

export function NewProposalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentRole } = useApp();

  // Form state
  const [title, setTitle] = useState('');
  const [proposalType, setProposalType] = useState<ProposalType>('Interpretation');
  const [proposedVersion, setProposedVersion] = useState('2025.2');
  const [rationale, setRationale] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // QA pre-fill data
  const [qaResult, setQaResult] = useState<QAStudyResult | null>(null);
  const [qaProposal, setQaProposal] = useState<QAProposedChange | null>(null);

  // Pre-fill from QA Impact if query params present
  useEffect(() => {
    const proposalParam = searchParams.get('proposal');
    const cohortParam = searchParams.get('cohort');

    // Also handle from catalogs (type=interpretation/assumption, ref=decision_point_id)
    const typeParam = searchParams.get('type');
    const refParam = searchParams.get('ref');

    if (proposalParam && cohortParam) {
      // From QA Impact
      const proposal = qaProposedChanges.find((p) => p.proposal_id === proposalParam);
      const result = getQAStudyResult(cohortParam, proposalParam);

      if (proposal) {
        setQaProposal(proposal);
        setTitle(proposal.label);
        setProposalType(proposal.change_type === 'INTERPRETATION' ? 'Interpretation' : 'Assumption');
        setRationale(proposal.description);
      }

      if (result) {
        setQaResult(result);
      }
    } else if (typeParam && refParam) {
      // From Catalogs
      setProposalType(typeParam === 'interpretation' ? 'Interpretation' : 'Assumption');
      setTitle(`Update ${refParam}`);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !rationale.trim()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1000);
  };

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Proposal Submitted</h2>
          <p className="text-muted-foreground mb-6">
            Your proposal has been submitted for approval. You will be notified when it moves through the workflow.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/governance"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              View All Proposals
            </Link>
            <button
              onClick={() => {
                setSubmitSuccess(false);
                setTitle('');
                setRationale('');
                setQaResult(null);
                setQaProposal(null);
              }}
              className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/governance"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Governance
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Create Change Proposal</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Propose changes to interpretation or assumption policies for review and approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* QA Impact Summary (if pre-filled) */}
        {qaResult && <QAImpactSummary result={qaResult} />}

        {/* Form Fields */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold mb-2">Proposal Details</h3>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Include Accessories by Default"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium mb-1">
              Proposal Type <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              value={proposalType}
              onChange={(e) => setProposalType(e.target.value as ProposalType)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Interpretation">Interpretation Change</option>
              <option value="Assumption">Assumption Change</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              {proposalType === 'Interpretation'
                ? 'Changes how policies are interpreted for coverage decisions.'
                : 'Changes default assumptions when facts are unknown.'}
            </p>
          </div>

          {/* Proposed Version */}
          <div>
            <label htmlFor="version" className="block text-sm font-medium mb-1">
              Proposed Version
            </label>
            <input
              type="text"
              id="version"
              value={proposedVersion}
              onChange={(e) => setProposedVersion(e.target.value)}
              placeholder="e.g., 2025.2"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Version number for the proposed change set.
            </p>
          </div>

          {/* Rationale */}
          <div>
            <label htmlFor="rationale" className="block text-sm font-medium mb-1">
              Rationale <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rationale"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={5}
              placeholder="Explain why this change is needed, the expected benefits, and any potential risks..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              required
            />
          </div>
        </div>

        {/* Approval Workflow */}
        <ApprovalWorkflow steps={DEFAULT_APPROVAL_STEPS} />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Submitting as: <span className="font-medium">{currentRole}</span>
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/governance')}
              className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !rationale.trim()}
              className={cn(
                'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
                !isSubmitting && title.trim() && rationale.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
