import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createContainer, type AppContainer } from './container';

const AppContainerContext = createContext<AppContainer | null>(null);

export function AppContainerProvider({ children }: { children: ReactNode }) {
  const container = useMemo(() => createContainer(), []);
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
