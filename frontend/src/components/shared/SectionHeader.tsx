import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  /** Lucide icon component to display before the title */
  icon: LucideIcon;
  /** Section title text */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SectionHeader - an h2 heading with a contextual icon.
 * Use for major content sections within a page.
 */
export function SectionHeader({ icon: Icon, children, className }: SectionHeaderProps) {
  return (
    <h2 className={cn('flex items-center gap-2 text-lg font-semibold', className)}>
      <Icon className="h-5 w-5 text-muted-foreground" />
      {children}
    </h2>
  );
}
