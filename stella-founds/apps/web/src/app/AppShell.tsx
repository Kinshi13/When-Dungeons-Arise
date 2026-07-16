import { Suspense, useCallback, useMemo, useState } from 'react';
import { useLocation, Route, Routes } from 'react-router-dom';
import {
  ResponsiveContainer,
  DesktopLayout,
  TabletLayout,
  MobileLayout,
  StellaBottomNavigation,
  StellaCore,
} from '@stella-founds/stella-ui';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PlaceholderToast } from './PlaceholderToast';
import { SummaryPanel } from '../features/dashboard/SummaryPanel';
import { DashboardPage, PlaceholderPage } from '../router';
import { bottomNavItems } from '../features/navigation/navItems';
import { useWebStellaCoreActions } from '../features/stellaCore/useWebStellaCoreActions';

function AppRoutes() {
  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contas" element={<PlaceholderPage title="Contas" />} />
        <Route path="/calendario" element={<PlaceholderPage title="Calendário" />} />
        <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" />} />
        <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" />} />
      </Routes>
    </Suspense>
  );
}

export function AppShell() {
  const location = useLocation();
  const [placeholderMessage, setPlaceholderMessage] = useState<string | null>(null);

  const showPlaceholder = useCallback((label: string) => {
    setPlaceholderMessage(label);
    window.setTimeout(() => setPlaceholderMessage(null), 2000);
  }, []);

  const stellaCoreActions = useWebStellaCoreActions(showPlaceholder);
  const stellaCore = useMemo(
    () => <StellaCore actions={stellaCoreActions} activeContext={location.pathname} />,
    [stellaCoreActions, location.pathname],
  );

  return (
    <>
      <ResponsiveContainer
        desktop={
          <>
            <DesktopLayout
              sidebar={<Sidebar />}
              header={<Header />}
              main={<AppRoutes />}
              rightPanel={<SummaryPanel />}
            />
            {stellaCore}
          </>
        }
        tablet={
          <>
            <TabletLayout
              sidebar={<Sidebar collapsed />}
              header={<Header />}
              main={<AppRoutes />}
              rightPanel={<SummaryPanel />}
            />
            {stellaCore}
          </>
        }
        mobile={
          <MobileLayout
            header={null}
            main={<AppRoutes />}
            stellaCore={stellaCore}
            bottomNav={<StellaBottomNavigation items={bottomNavItems} />}
          />
        }
      />
      <PlaceholderToast message={placeholderMessage} />
    </>
  );
}
