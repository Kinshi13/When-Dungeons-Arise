import { Suspense, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Route, Routes } from 'react-router-dom';
import {
  ResponsiveContainer,
  DesktopLayout,
  TabletLayout,
  MobileLayout,
  StellaBottomNavigation,
  StellaCore,
  StellaToastViewport,
  showStellaToast,
  StellaParallax,
  StellaSkyBackground,
  HeroStars,
  stellaParallaxScene,
  StellaOfflineBanner,
} from '@stella-founds/stella-ui';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SummaryPanel } from '../features/dashboard/SummaryPanel';
import { DashboardSummaryProvider } from '../features/dashboard/DashboardSummaryContext';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { BillsPage, PlaceholderPage } from '../router';
import { bottomNavItems } from '../features/navigation/navItems';
import { useWebStellaCoreActions } from '../features/stellaCore/useWebStellaCoreActions';
import { FinanceDialogProvider, useFinanceDialog } from '../features/finance/FinanceDialogContext';
import { FinanceEntryDialog } from '../features/finance/FinanceEntryDialog';
import { MarkPaidPicker } from '../features/bills/MarkPaidPicker';
import { GlobalCalculatorProvider, useGlobalCalculator } from '../features/calculator/GlobalCalculatorProvider';
import { GlobalCalculatorHost } from '../features/calculator/GlobalCalculatorHost';
import type { FinanceEntryType } from '@stella-founds/core';
import './AppShell.css';

const LAST_SCREEN_KEY = 'stella-last-screen';

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRestoredRef = useRef(false);

  // One-shot: landing on "/" fresh (not via an explicit link/back-button
  // navigation elsewhere in the app) restores whatever screen was open last
  // time. Any direct/deep link still works exactly as typed — this only
  // ever fires for the bare root path, and only once per page load.
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    if (location.pathname !== '/') return;
    const lastScreen = window.localStorage.getItem(LAST_SCREEN_KEY);
    if (lastScreen && lastScreen !== '/') {
      navigate(lastScreen, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LAST_SCREEN_KEY, location.pathname);
  }, [location.pathname]);

  return (
    <Suspense fallback={<p>Carregando…</p>}>
      <Routes>
        {/* Dashboard is a static import (see the top of this file), not
            React.lazy — it's the very first thing anyone sees, so it
            ships in the main chunk instead of costing an extra
            network round-trip before first paint. */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contas" element={<BillsPage />} />
        <Route path="/calendario" element={<PlaceholderPage title="Calendário" transitionKey={location.pathname} />} />
        <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" transitionKey={location.pathname} />} />
        <Route path="/configuracoes" element={<PlaceholderPage title="Configurações" transitionKey={location.pathname} />} />
      </Routes>
    </Suspense>
  );
}

const actionToEntryType: Partial<Record<string, FinanceEntryType>> = {
  'new-bill': 'bill',
  'new-subscription': 'subscription',
  'new-income': 'income',
};

/**
 * The only piece of the shell that actually needs the current route —
 * isolated into its own component so navigating doesn't re-render
 * AppShellContent (and, with it, Sidebar/Header/SummaryPanel/the global
 * parallax — none of which depend on the pathname at all). Web Fase 6.5:
 * this used to live inline in AppShellContent, which meant every
 * navigation re-rendered the entire shell subtree for no reason.
 */
function AppStellaCore() {
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

  return (
    <>
      <StellaCore actions={stellaCoreActions} activeContext={location.pathname} />
      {markPaidOpen && <MarkPaidPicker onClose={() => setMarkPaidOpen(false)} />}
    </>
  );
}

function AppShellContent() {
  return (
    <>
      <StellaOfflineBanner />

      {/* Web Fase 6.8: identity no longer depends on the parallax engine —
          StellaSkyBackground is one static scene, mounted once, that never
          changes. HeroStars is the only thing that still animates. */}
      <StellaSkyBackground />
      <StellaParallax fixed layers={stellaParallaxScene} className="app-shell__background">
        <HeroStars />
      </StellaParallax>

      <div className="app-shell__foreground">
        <ResponsiveContainer
          desktop={
            <>
              <DesktopLayout
                sidebar={<Sidebar />}
                header={<Header />}
                main={<AppRoutes />}
                rightPanel={<SummaryPanel />}
              />
              <AppStellaCore />
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
              <AppStellaCore />
            </>
          }
          mobile={
            <MobileLayout
              header={null}
              main={<AppRoutes />}
              stellaCore={<AppStellaCore />}
              bottomNav={<StellaBottomNavigation items={bottomNavItems} />}
            />
          }
        />

        <FinanceEntryDialog />
        <GlobalCalculatorHost />
        <StellaToastViewport />
      </div>
    </>
  );
}

export function AppShell() {
  return (
    <FinanceDialogProvider>
      <GlobalCalculatorProvider>
        <DashboardSummaryProvider>
          <AppShellContent />
        </DashboardSummaryProvider>
      </GlobalCalculatorProvider>
    </FinanceDialogProvider>
  );
}
