import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabeledValueProps {
  icon?: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
  /** Renders value in monospace font */
  mono?: boolean;
  /** Makes the value larger and bolder */
  prominent?: boolean;
}

/**
 * LabeledValue - displays a label/value pair with an optional leading icon.
 * Use for info cards, metadata displays, and form-like read-only fields.
 */
export function LabeledValue({
  icon: Icon,
  label,
  children,
  className,
  mono = false,
  prominent = false,
}: LabeledValueProps) {
  return (
    <div className={cn('', className)}>
      <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1',
          mono && 'font-mono text-sm',
          prominent ? 'text-lg font-semibold tabular-nums' : 'font-medium'
        )}
      >
        {children}
      </dd>
    </div>
  );
}
