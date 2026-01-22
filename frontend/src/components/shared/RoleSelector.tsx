import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Role } from '@/types';

const roles: Role[] = ['Adjuster', 'Supervisor', 'QA Lead', 'Policy Owner'];

export function RoleSelector() {
  const { currentRole, setCurrentRole } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
      >
        <User className="h-4 w-4" />
        <span>{currentRole}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-popover p-1 shadow-lg">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Select Role
          </div>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => {
                setCurrentRole(role);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              {role}
              {currentRole === role && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
