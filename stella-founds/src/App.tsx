import { Route, Routes } from 'react-router-dom';
import { BottomNav } from './ui/navigation/BottomNav';
import { StellaCore } from './ui/stella-core/StellaCore';
import { HomeScreen } from './features/home/HomeScreen';
import { BillsScreen } from './features/bills/BillsScreen';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { ReportsScreen } from './features/reports/ReportsScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/contas" element={<BillsScreen />} />
        <Route path="/calendario" element={<CalendarScreen />} />
        <Route path="/relatorios" element={<ReportsScreen />} />
        <Route path="/configuracoes" element={<SettingsScreen />} />
      </Routes>
      <StellaCore onAction={(actionId) => console.log('stella-core action', actionId)} />
      <BottomNav />
    </div>
  );
}

export default App;
