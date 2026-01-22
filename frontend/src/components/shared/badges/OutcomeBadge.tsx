import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DecisionStatus } from '@/types';

interface OutcomeBadgeProps {
  /** The decision outcome status */
  status: DecisionStatus;
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg';
}

const configs: Record<DecisionStatus, { className: string; icon: typeof CheckCircle }> = {
  Approved: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
  },
  Partial: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: AlertCircle,
  },
  Denied: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: XCircle,
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-lg gap-2',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-5 w-5',
};

/**
 * OutcomeBadge - displays a decision outcome status (Approved/Partial/Denied).
 * Includes color-coded icon for quick visual recognition.
 */
export function OutcomeBadge({ status, size = 'md' }: OutcomeBadgeProps) {
  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        config.className
      )}
    >
      <Icon className={iconSizes[size]} />
      {status}
    </span>
  );
}
