import { Check, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FactStatus } from '@/types';

interface FactStatusBadgeProps {
  status: FactStatus;
}

const configs: Record<FactStatus, { className: string; icon: typeof Check }> = {
  KNOWN: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: Check,
  },
  UNKNOWN: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: HelpCircle,
  },
};

export function FactStatusBadge({ status }: FactStatusBadgeProps) {
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
