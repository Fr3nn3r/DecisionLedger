import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { DecisionRun, Role } from '@/types';

interface AppContextType {
  // Role management
  currentRole: Role;
  setCurrentRole: (role: Role) => void;

  // Decision runs (in-memory store)
  decisionRuns: DecisionRun[];
  addDecisionRun: (run: DecisionRun) => void;
  getDecisionRun: (runId: string) => DecisionRun | undefined;
  getRunsForClaim: (claimId: string) => DecisionRun[];

  // Demo data reset
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [currentRole, setCurrentRole] = useState<Role>('Adjuster');
  const [decisionRuns, setDecisionRuns] = useState<DecisionRun[]>([]);

  const addDecisionRun = useCallback((run: DecisionRun) => {
    setDecisionRuns((prev) => [run, ...prev]);
  }, []);

  const getDecisionRun = useCallback(
    (runId: string) => {
      return decisionRuns.find((run) => run.run_id === runId);
    },
    [decisionRuns]
  );

  const getRunsForClaim = useCallback(
    (claimId: string) => {
      return decisionRuns.filter((run) => run.claim_id === claimId);
    },
    [decisionRuns]
  );

  const resetDemoData = useCallback(() => {
    setDecisionRuns([]);
    setCurrentRole('Adjuster');
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        decisionRuns,
        addDecisionRun,
        getDecisionRun,
        getRunsForClaim,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
