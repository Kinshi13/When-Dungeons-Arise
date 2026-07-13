import { useNavigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './ui/navigation/BottomNav';
import { StellaCore } from './ui/stella-core/StellaCore';
import { HomeScreen } from './features/home/HomeScreen';
import { BillsScreen } from './features/bills/BillsScreen';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { FinanceDialogProvider, useFinanceDialog } from './features/finance/FinanceDialogContext';
import { FinanceEntryDialog } from './features/finance/FinanceEntryDialog';
import { StellaParallaxBackground } from './ui/parallax/StellaParallaxBackground';
import { emitReportsExportRequested } from './core/events';
import type { FinanceEntryType } from './core/models';

const actionToEntryType: Partial<Record<string, FinanceEntryType>> = {
  'add-expense': 'expense',
  'new-bill': 'bill',
  'new-subscription': 'subscription',
  'add-income': 'income',
  'new-income': 'income',
};

function AppContent() {
  const navigate = useNavigate();
  const { openCreate } = useFinanceDialog();

  function handleStellaCoreAction(actionId: string) {
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
      <StellaCore onAction={handleStellaCoreAction} />
      <BottomNav />
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
