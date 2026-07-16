import { useMemo } from 'react';
import { useLocation, useNavigate, Route, Routes } from 'react-router-dom';
import { StellaBottomNavigation, StellaCore, StellaParallaxBackground, type StellaAction } from '@stella-founds/stella-ui';
import { HomeScreen } from './features/home/HomeScreen';
import { BillsScreen } from './features/bills/BillsScreen';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { FinanceDialogProvider, useFinanceDialog } from './features/finance/FinanceDialogContext';
import { FinanceEntryDialog } from './features/finance/FinanceEntryDialog';
import { emitReportsExportRequested } from '@stella-founds/core';
import { actionToEntryType, getStellaCoreActionsForRoute } from './features/stellaCore/stellaCoreActions';
import { bottomNavItems } from './features/navigation/navItems';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openCreate } = useFinanceDialog();

  function runStellaCoreAction(actionId: string) {
    const entryType = actionToEntryType[actionId];
    if (entryType) {
      openCreate(entryType);
      return;
    }
    if (actionId === 'mark-paid') {
      navigate('/contas');
      return;
    }
    if (actionId === 'export-summary') {
      emitReportsExportRequested();
    }
  }

  const stellaCoreActions: StellaAction[] = useMemo(
    () =>
      getStellaCoreActionsForRoute(location.pathname).map((action) => ({
        id: action.id,
        label: action.label,
        execute: () => runStellaCoreAction(action.id),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.pathname],
  );

  return (
    <div className="app-shell">
      <StellaParallaxBackground />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/contas" element={<BillsScreen />} />
        <Route path="/calendario" element={<CalendarScreen />} />
        <Route path="/relatorios" element={<ReportsScreen />} />
        <Route path="/configuracoes" element={<SettingsScreen />} />
      </Routes>
      <StellaCore actions={stellaCoreActions} activeContext={location.pathname} />
      <StellaBottomNavigation items={bottomNavItems} />
      <FinanceEntryDialog />
    </div>
  );
}

function App() {
  return (
    <FinanceDialogProvider>
      <AppContent />
    </FinanceDialogProvider>
  );
}

export default App;
