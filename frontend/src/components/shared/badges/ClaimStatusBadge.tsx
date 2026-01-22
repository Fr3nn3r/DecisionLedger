import { Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClaimStatus } from '@/types';

interface ClaimStatusBadgeProps {
  /** The claim status (Ready or Decided) */
  status: ClaimStatus;
}

const configs: Record<ClaimStatus, { className: string; icon: typeof Clock }> = {
  Ready: {
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Clock,
  },
  Decided: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2,
  },
};

/**
 * ClaimStatusBadge - displays a claim processing status (Ready/Decided).
 * Ready shows clock icon, Decided shows checkmark.
 */
export function ClaimStatusBadge({ status }: ClaimStatusBadgeProps) {
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}
