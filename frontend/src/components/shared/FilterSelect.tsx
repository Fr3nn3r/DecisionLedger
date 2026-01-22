import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  icon: LucideIcon;
  className?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  className,
}: FilterSelectProps) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Icon className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background pl-8 pr-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 h-4 w-4 text-muted-foreground pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
