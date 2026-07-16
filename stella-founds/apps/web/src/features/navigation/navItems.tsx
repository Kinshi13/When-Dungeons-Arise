import {
  TodayIcon,
  BillsIcon,
  CalendarIcon,
  ReportsIcon,
  SettingsIcon,
  type StellaNavItem,
} from '@stella-founds/stella-ui';

/** Bottom nav keeps the same 4-slot shape as Android (2 + Stella Core + 2). */
export const bottomNavItems: StellaNavItem[] = [
  { id: 'today', to: '/', label: 'Hoje', icon: <TodayIcon />, end: true },
  { id: 'bills', to: '/contas', label: 'Contas', icon: <BillsIcon /> },
  { id: 'calendar', to: '/calendario', label: 'Calendário', icon: <CalendarIcon /> },
  { id: 'reports', to: '/relatorios', label: 'Relatórios', icon: <ReportsIcon /> },
];

/** Sidebar has room for the Configurações placeholder that the mobile bottom nav's fixed grid doesn't. */
export const sidebarNavItems: StellaNavItem[] = [
  ...bottomNavItems,
  { id: 'settings', to: '/configuracoes', label: 'Configurações', icon: <SettingsIcon /> },
];
