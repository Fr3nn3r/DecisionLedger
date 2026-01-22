import { Link } from 'react-router-dom';
import { AlertCircle, FileQuestion, Settings, RefreshCw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ErrorType = 'not-found' | 'config-error' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title: string;
  message: string;
  details?: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
}

const iconMap = {
  'not-found': FileQuestion,
  'config-error': Settings,
  'generic': AlertCircle,
};

const colorMap = {
  'not-found': 'text-muted-foreground',
  'config-error': 'text-yellow-500',
  'generic': 'text-red-500',
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  details,
  actionLabel,
  actionHref,
  onRetry,
}: ErrorStateProps) {
  const Icon = iconMap[type];
  const iconColor = colorMap[type];

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-4">
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-full',
          type === 'not-found' && 'bg-muted',
          type === 'config-error' && 'bg-yellow-100 dark:bg-yellow-900/30',
          type === 'generic' && 'bg-red-100 dark:bg-red-900/30'
        )}
      >
        <Icon className={cn('h-8 w-8', iconColor)} />
      </div>

      <h1 className="mb-2 text-2xl font-semibold text-center">{title}</h1>
      <p className="mb-4 text-center text-muted-foreground max-w-md">{message}</p>

      {details && (
        <p className="mb-6 text-center text-sm text-muted-foreground/70 max-w-md">{details}</p>
      )}

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}

        {actionHref && (
          <Link
            to={actionHref}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {actionHref === '/' || actionHref === '/claims' ? (
              <Home className="h-4 w-4" />
            ) : null}
            {actionLabel || 'Go Back'}
          </Link>
        )}
      </div>
    </div>
  );
}
