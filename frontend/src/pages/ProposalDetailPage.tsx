import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  Circle,
  Clock,
  XCircle,
  AlertTriangle,
  Rocket,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ErrorState } from '@/components/shared/ErrorState';
import { ProposalDetailSkeleton } from '@/components/shared/Skeleton';
import { useToast } from '@/components/shared/Toast';
import { getProposalById } from '@/data';
import { formatDate, formatCHF, cn } from '@/lib/utils';
import type { ApprovalStep, ProposalStatus, Role, ChangeProposal } from '@/types';

function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const configs: Record<ProposalStatus, { className: string; icon: typeof Clock }> = {
    Draft: {
      className: 'bg-secondary text-secondary-foreground',
      icon: FileText,
    },
    'Pending Approval': {
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: Clock,
    },
    Approved: {
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: CheckCircle,
    },
    Published: {
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: Rocket,
    },
    Rejected: {
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: XCircle,
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
        config.className
      )}
    >
      <Icon className="h-4 w-4" />
      {status}
    </span>
  );
}

function ApprovalStepIndicator({ step, index }: { step: ApprovalStep; index: number }) {
  const getStepIcon = () => {
    switch (step.status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'Rejected':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5 text-muted-foreground" />;
      case 'Pending':
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        {getStepIcon()}
        {index < 2 && (
          <div
            className={cn(
              'w-0.5 h-8 mt-1',
              step.status === 'Completed' ? 'bg-green-400' : 'bg-muted'
            )}
          />
        )}
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">{step.step_name}</p>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              step.status === 'Completed' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
              step.status === 'Pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
              step.status === 'Rejected' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
              step.status === 'Cancelled' && 'bg-muted text-muted-foreground'
            )}
          >
            {step.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Required: {step.required_role}</p>
        {step.completed_at && step.completed_by && (
          <p className="text-xs text-muted-foreground mt-1">
            {step.status === 'Completed' ? 'Completed' : step.status} by {step.completed_by} on{' '}
            {formatDate(step.completed_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function canSubmitForApproval(
  _currentRole: Role,
  proposal: ReturnType<typeof getProposalById>
): boolean {
  void _currentRole; // Reserved for future role-based validation
  if (!proposal) return false;
  if (proposal.status !== 'Draft') return false;
  // Any role can submit a draft proposal for approval
  return true;
}

function canApprove(currentRole: Role, proposal: ReturnType<typeof getProposalById>): boolean {
  if (!proposal) return false;
  if (proposal.status !== 'Pending Approval') return false;

  // Find the current pending step
  const pendingStep = proposal.approval_steps.find((s) => s.status === 'Pending');
  if (!pendingStep) return false;

  // Policy Owner can approve any step; others must match the required role
  if (currentRole === 'Policy Owner') return true;
  return pendingStep.required_role === currentRole;
}

function canPublish(currentRole: Role, proposal: ReturnType<typeof getProposalById>): boolean {
  if (!proposal) return false;
  if (proposal.status !== 'Approved') return false;

  // Only Policy Owner can publish
  return currentRole === 'Policy Owner';
}

export function ProposalDetailPage() {
  const { proposalId } = useParams<{ proposalId: string }>();
  const _navigate = useNavigate();
  const { currentRole, publishVersion, publishedVersion: _publishedVersion } = useApp();
  void _navigate; // Reserved for future navigation
  void _publishedVersion; // Reserved for future display
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [proposal, setProposal] = useState<ChangeProposal | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<'submitted' | 'approved' | 'published' | null>(null);

  // Simulate loading delay for realistic UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setProposal(proposalId ? getProposalById(proposalId) : undefined);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [proposalId]);

  if (isLoading) {
    return <ProposalDetailSkeleton />;
  }

  if (!proposal) {
    return (
      <ErrorState
        type="not-found"
        title="Proposal Not Found"
        message={`The proposal "${proposalId}" could not be found.`}
        details="The proposal ID may be incorrect, or the proposal may have been removed."
        actionLabel="Back to Governance"
        actionHref="/governance"
      />
    );
  }

  const handleSubmitForApproval = () => {
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setActionSuccess('submitted');
      showToast('success', 'Proposal submitted', 'The proposal is now pending approval.');
    }, 1000);
  };

  const handleApprove = () => {
    setIsApproving(true);
    // Simulate approval
    setTimeout(() => {
      setIsApproving(false);
      setActionSuccess('approved');
      showToast('success', 'Step approved', 'The proposal has moved to the next approval step.');
    }, 1000);
  };

  const handlePublish = () => {
    if (!proposal) return;
    setIsPublishing(true);
    // Simulate publishing and update app state
    setTimeout(() => {
      publishVersion(proposal.proposal_id, proposal.proposal_type, proposal.proposed_version);
      setIsPublishing(false);
      setActionSuccess('published');
      showToast('success', `Version ${proposal.proposed_version} published`, 'New decisions will use the published version.');
    }, 1000);
  };

  const userCanSubmit = canSubmitForApproval(currentRole, proposal);
  const userCanApprove = canApprove(currentRole, proposal);
  const userCanPublish = canPublish(currentRole, proposal);

  // Find the next required role for pending approvals
  const nextPendingStep = proposal.approval_steps.find((s) => s.status === 'Pending');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Banner */}
      {actionSuccess && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {actionSuccess === 'submitted'
                  ? 'Proposal Submitted for Approval'
                  : actionSuccess === 'approved'
                  ? 'Proposal Approved'
                  : `Version ${proposal?.proposed_version} is now active!`}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {actionSuccess === 'submitted'
                  ? 'The proposal is now pending review. The approval workflow has started.'
                  : actionSuccess === 'approved'
                  ? 'The proposal has moved to the next approval step.'
                  : 'New decisions will use the published version. Re-run a claim to see the new defaults applied.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/governance"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Governance
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{proposal.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{proposal.proposal_id}</p>
          </div>
          <ProposalStatusBadge status={proposal.status} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Proposal Details</h2>

            <dl className="grid gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Type</dt>
                <dd className="font-medium">{proposal.proposal_type} Change</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Proposed Version</dt>
                <dd className="font-medium">{proposal.proposed_version}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Created</dt>
                <dd className="font-medium">
                  {formatDate(proposal.created_at)} by {proposal.created_by}
                </dd>
              </div>
              {proposal.approved_at && proposal.approved_by && (
                <div>
                  <dt className="text-sm text-muted-foreground">Approved</dt>
                  <dd className="font-medium">
                    {formatDate(proposal.approved_at)} by {proposal.approved_by}
                  </dd>
                </div>
              )}
              {proposal.published_at && (
                <div>
                  <dt className="text-sm text-muted-foreground">Published</dt>
                  <dd className="font-medium">{formatDate(proposal.published_at)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-2">Rationale</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {proposal.rationale}
              </p>
            </div>
          </div>

          {/* QA Impact Summary (if present) */}
          {proposal.qa_impact_summary && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-6">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
                QA Impact Summary
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Cohort</p>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {proposal.qa_impact_summary.cohort_label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Impacted Claims</p>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {proposal.qa_impact_summary.impacted_claims_count}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-blue-700 dark:text-blue-300">Total Delta Payout</p>
                  <p
                    className={cn(
                      'text-xl font-bold',
                      proposal.qa_impact_summary.total_delta_payout > 0
                        ? 'text-green-600'
                        : proposal.qa_impact_summary.total_delta_payout < 0
                        ? 'text-red-600'
                        : 'text-muted-foreground'
                    )}
                  >
                    {proposal.qa_impact_summary.total_delta_payout > 0 ? '+' : ''}
                    {formatCHF(proposal.qa_impact_summary.total_delta_payout)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Workflow */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Approval Workflow</h2>
            <div>
              {proposal.approval_steps.map((step, index) => (
                <ApprovalStepIndicator key={index} step={step} index={index} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>

            {/* Role Restriction Notice */}
            {proposal.status === 'Pending Approval' && !userCanApprove && nextPendingStep && (
              <div className="mb-4 rounded-md bg-muted p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Approval Required</p>
                    <p className="text-muted-foreground">
                      This step requires <strong>{nextPendingStep.required_role}</strong> role.
                      {currentRole !== nextPendingStep.required_role && (
                        <span> You are currently: {currentRole}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {proposal.status === 'Approved' && !userCanPublish && (
              <div className="mb-4 rounded-md bg-muted p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Policy Owner Required</p>
                    <p className="text-muted-foreground">
                      Only Policy Owner can publish new versions.
                      {currentRole !== 'Policy Owner' && (
                        <span> You are currently: {currentRole}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {/* Approve Button */}
              {proposal.status === 'Pending Approval' && (
                <button
                  onClick={handleApprove}
                  disabled={!userCanApprove || isApproving}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                    userCanApprove && !isApproving
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {isApproving ? (
                    'Approving...'
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve Step
                    </>
                  )}
                </button>
              )}

              {/* Publish Button */}
              {proposal.status === 'Approved' && (
                <button
                  onClick={handlePublish}
                  disabled={!userCanPublish || isPublishing}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                    userCanPublish && !isPublishing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {isPublishing ? (
                    'Publishing...'
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      Publish New Version
                    </>
                  )}
                </button>
              )}

              {/* Published Notice */}
              {proposal.status === 'Published' && (
                <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-3 text-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Version Published
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    This version is now active
                  </p>
                </div>
              )}

              {/* Rejected Notice */}
              {proposal.status === 'Rejected' && (
                <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-center">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Proposal Rejected
                  </p>
                </div>
              )}

              {/* Submit for Approval Button (Draft status) */}
              {proposal.status === 'Draft' && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={!userCanSubmit || isSubmitting}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
                    userCanSubmit && !isSubmitting
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      Submit for Approval
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
