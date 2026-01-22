import { Shield, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskTier } from '@/types';

interface RiskBadgeProps {
  tier: RiskTier;
}

const configs: Record<RiskTier, { className: string; icon: typeof Shield }> = {
  Low: {
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: Shield,
  },
  Medium: {
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: AlertTriangle,
  },
  High: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: AlertOctagon,
  },
};

export function RiskBadge({ tier }: RiskBadgeProps) {
  const config = configs[tier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {tier}
    </span>
  );
}
