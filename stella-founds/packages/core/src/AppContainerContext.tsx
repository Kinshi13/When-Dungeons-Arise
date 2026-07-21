import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { createContainer, type AppContainer } from './container';
import { seedDefaultsIfEmpty } from './seed';

const AppContainerContext = createContext<AppContainer | null>(null);

export function AppContainerProvider({
  children,
  container: containerOverride,
}: {
  children: ReactNode;
  /** Inject a pre-built container (e.g. one backed by a fake/in-memory StorageAdapter) instead of the default IndexedDB-backed one. */
  container?: AppContainer;
}) {
  const defaultContainer = useMemo(() => (containerOverride ? null : createContainer()), [containerOverride]);
  const container = containerOverride ?? defaultContainer!;

  useEffect(() => {
    seedDefaultsIfEmpty(container.financeCategoryRepository, container.financeNucleusRepository).then(() => {
      container.recurrenceService.generateAll();
    });
    void container.authController.restoreSession();
    void container.syncEngine.start();
    return () => container.syncEngine.stop();
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
