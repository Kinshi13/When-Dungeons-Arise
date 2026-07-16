import { Suspense, useMemo, useState } from 'react';
import { useLocation, Route, Routes } from 'react-router-dom';
import {
  ResponsiveContainer,
  DesktopLayout,
  TabletLayout,
  MobileLayout,
  StellaBottomNavigation,
  StellaCore,
  StellaToastViewport,
  showStellaToast,
} from '@stella-founds/stella-ui';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SummaryPanel } from '../features/dashboard/SummaryPanel';
import { DashboardPage, BillsPage, PlaceholderPage } from '../router';
import { bottomNavItems } from '../features/navigation/navItems';
import { useWebStellaCoreActions } from '../features/stellaCore/useWebStellaCoreActions';
import { FinanceDialogProvider, useFinanceDialog } from '../features/finance/FinanceDialogContext';
import { FinanceEntryDialog } from '../features/finance/FinanceEntryDialog';
import { MarkPaidPicker } from '../features/bills/MarkPaidPicker';
import { GlobalCalculatorProvider, useGlobalCalculator } from '../features/calculator/GlobalCalculatorProvider';
import { GlobalCalculatorHost } from '../features/calculator/GlobalCalculatorHost';
import type { FinanceEntryType } from '@stella-founds/core';

function AppRoutes() {
  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contas" element={<BillsPage />} />
        <Route path="/calendario" element={<PlaceholderPage title="Calendário" />} />
        <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" />} />
        <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" />} />
      </Routes>
    </Suspense>
  );
}

const actionToEntryType: Partial<Record<string, FinanceEntryType>> = {
  'new-bill': 'bill',
  'new-subscription': 'subscription',
  'new-income': 'income',
};

function AppShellContent() {
  const location = useLocation();
  const { openCreate } = useFinanceDialog();
  const { openCalculator } = useGlobalCalculator();
  const [markPaidOpen, setMarkPaidOpen] = useState(false);

  const stellaCoreActions = useWebStellaCoreActions({
    pathname: location.pathname,
    openCreate: (actionId) => {
      const entryType = actionToEntryType[actionId];
      if (entryType) openCreate(entryType);
    },
    openMarkPaid: () => setMarkPaidOpen(true),
    openCalculator,
    onPlaceholder: (label) => showStellaToast(`${label} — em breve`, 'info'),
  });

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

      <FinanceEntryDialog />
      {markPaidOpen && <MarkPaidPicker onClose={() => setMarkPaidOpen(false)} />}
      <GlobalCalculatorHost />
      <StellaToastViewport />
    </>
  );
}

export function AppShell() {
  return (
    <FinanceDialogProvider>
      <GlobalCalculatorProvider>
        <AppShellContent />
      </GlobalCalculatorProvider>
    </FinanceDialogProvider>
  );
}
