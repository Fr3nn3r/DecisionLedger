import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from './Toast';
import { RoleSelector } from './RoleSelector';
import { ThemePopover } from './ThemePopover';
import { Breadcrumbs } from './Breadcrumbs';

export function Header() {
  const navigate = useNavigate();
  const { resetDemoData } = useApp();
  const { showToast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setShowResetConfirm(false);
    showToast('success', 'Demo data reset', 'All decision runs cleared and defaults restored.');
    navigate('/claims');
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Breadcrumbs */}
        <Breadcrumbs />

        {/* Right: Controls */}
        <div className="flex items-center gap-4">
          {/* Demo Mode Badge */}
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            Demo Mode
          </span>

          {/* Role Selector */}
          <RoleSelector />

          {/* Theme Toggle */}
          <ThemePopover />

          {/* Reset Button */}
          <div className="relative">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Demo
            </button>

            {/* Confirmation Dialog */}
            {showResetConfirm && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowResetConfirm(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-border bg-popover p-4 shadow-lg">
                  <p className="mb-3 text-sm text-popover-foreground">
                    Reset all demo data? This will clear decision runs and restore defaults.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReset}
                      className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:bg-destructive/90"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
