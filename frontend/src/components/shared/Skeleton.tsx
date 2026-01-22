import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  );
}

export function SkeletonText({ className, lines = 1 }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function SkeletonBadge({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-6 w-16 rounded-full', className)} />;
}

export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-9 w-24 rounded-md', className)} />;
}

// Table skeleton with configurable rows and columns
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      {/* Header */}
      <div className="bg-muted px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="bg-card divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1">
                {colIndex === 0 ? (
                  <Skeleton className="h-4 w-24" />
                ) : colIndex === columns - 1 ? (
                  <SkeletonBadge />
                ) : (
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Card skeleton for detail pages
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-6', className)}>
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// Claims list page skeleton
export function ClaimsListSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-32 mb-6" />
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-4 w-24 ml-auto" />
      </div>
      {/* Table */}
      <SkeletonTable rows={10} columns={4} />
    </div>
  );
}

// Claim detail page skeleton
export function ClaimDetailSkeleton() {
  return (
    <div>
      {/* Back link */}
      <Skeleton className="h-4 w-24 mb-4" />
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonBadge className="w-20" />
      </div>
      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonButton className="w-full" />
        </div>
      </div>
    </div>
  );
}

// Governance page skeleton
export function GovernanceListSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <SkeletonButton className="w-40" />
      </div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 w-28 ml-auto" />
      </div>
      {/* Table */}
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}

// Proposal detail skeleton
export function ProposalDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Skeleton className="h-4 w-32 mb-4" />
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <SkeletonBadge className="w-28" />
      </div>
      {/* Content grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}

// Decision receipt skeleton
export function DecisionReceiptSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      {/* Summary Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <SkeletonBadge className="w-24 h-10" />
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-2 ml-auto" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <SkeletonTable rows={4} columns={3} />
      </div>
      {/* Governance Card */}
      <SkeletonCard />
      {/* Trace Preview */}
      <SkeletonCard />
    </div>
  );
}

// Trace viewer skeleton
export function TraceViewerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      {/* Determinism Note */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <SkeletonText lines={2} />
      </div>
      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-32 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <SkeletonCard />
      </div>
    </div>
  );
}

// Counterfactual page skeleton
export function CounterfactualSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      {/* Base Decision Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>
      {/* Change Selector Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <SkeletonText lines={2} className="mb-6" />
        <div className="flex gap-4">
          <Skeleton className="flex-1 h-24 rounded-lg" />
          <Skeleton className="flex-1 h-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
