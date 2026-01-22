import { FileEdit, Clock, CheckCircle, Globe, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProposalStatus } from '@/types';

interface ProposalStatusBadgeProps {
  /** The status of the proposal */
  status: ProposalStatus;
}

const configs: Record<ProposalStatus, { className: string; icon: typeof Clock }> = {
  Draft: {
    className: 'bg-secondary text-secondary-foreground',
    icon: FileEdit,
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
    icon: Globe,
  },
  Rejected: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
};

/**
 * ProposalStatusBadge - displays a status badge for governance proposals.
 * Shows icon + text with color coding based on status.
 */
export function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
