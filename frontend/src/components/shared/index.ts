/**
 * Shared components library for Decision Ledger.
 *
 * This module exports reusable UI components used across the application:
 * - Layout components: AppShell, Header, Sidebar, Breadcrumbs
 * - Form components: SearchInput, RoleSelector, ThemePopover
 * - Display components: SectionHeader, LabeledValue, ErrorState
 * - Feedback components: Skeleton, Toast
 * - Badge components: OutcomeBadge, ClaimStatusBadge, FactStatusBadge, RiskBadge, ProposalStatusBadge
 */

// Layout components
export { AppShell } from './AppShell';
export { Header } from './Header';
export { Sidebar } from './Sidebar';
export { Breadcrumbs } from './Breadcrumbs';

// Form components
export { SearchInput } from './SearchInput';
export { RoleSelector } from './RoleSelector';
export { ThemePopover } from './ThemePopover';

// Display components
export { SectionHeader } from './SectionHeader';
export { LabeledValue } from './LabeledValue';
export { ErrorState } from './ErrorState';

// Feedback components
export {
  Skeleton,
  SkeletonText,
  SkeletonBadge,
  SkeletonButton,
  SkeletonTable,
  SkeletonCard,
  ClaimsListSkeleton,
  ClaimDetailSkeleton,
  GovernanceListSkeleton,
  ProposalDetailSkeleton,
  DecisionReceiptSkeleton,
} from './Skeleton';
export { Toast, ToastProvider, useToast } from './Toast';

// Badge components (re-export from badges submodule)
export {
  OutcomeBadge,
  ClaimStatusBadge,
  FactStatusBadge,
  RiskBadge,
  ProposalStatusBadge,
} from './badges';
