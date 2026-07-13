import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { FinanceEntry, FinanceEntryType } from '../../core/models';

interface FinanceDialogState {
  open: boolean;
  initialType: FinanceEntryType;
  entry?: FinanceEntry;
}

interface FinanceDialogApi {
  state: FinanceDialogState;
  openCreate: (type: FinanceEntryType) => void;
  openEdit: (entry: FinanceEntry) => void;
  close: () => void;
}

const FinanceDialogContext = createContext<FinanceDialogApi | null>(null);

export function FinanceDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceDialogState>({ open: false, initialType: 'expense' });

  const api = useMemo<FinanceDialogApi>(
    () => ({
      state,
      openCreate: (type) => setState({ open: true, initialType: type, entry: undefined }),
      openEdit: (entry) => setState({ open: true, initialType: entry.type, entry }),
      close: () => setState((prev) => ({ ...prev, open: false })),
    }),
    [state],
  );

  return <FinanceDialogContext.Provider value={api}>{children}</FinanceDialogContext.Provider>;
}

export function useFinanceDialog(): FinanceDialogApi {
  const context = useContext(FinanceDialogContext);
  if (!context) {
    throw new Error('useFinanceDialog must be used within FinanceDialogProvider');
  }
  return context;
}
