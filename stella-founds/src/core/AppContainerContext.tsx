import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createContainer, type AppContainer } from './container';
import { seedDefaultsIfEmpty } from './seed';

const AppContainerContext = createContext<AppContainer | null>(null);

export function AppContainerProvider({ children }: { children: ReactNode }) {
  const container = useMemo(() => createContainer(), []);

  useEffect(() => {
    seedDefaultsIfEmpty(container.financeCategoryRepository, container.financeNucleusRepository);
  }, [container]);

  return (
    <AppContainerContext.Provider value={container}>
      {children}
    </AppContainerContext.Provider>
  );
}

export function useAppContainer(): AppContainer {
  const container = useContext(AppContainerContext);
  if (!container) {
    throw new Error('useAppContainer must be used within AppContainerProvider');
  }
  return container;
}
