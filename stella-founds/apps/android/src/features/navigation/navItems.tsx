import { TodayIcon, BillsIcon, CalendarIcon, ReportsIcon, type StellaNavItem } from '@stella-founds/stella-ui';

export const bottomNavItems: StellaNavItem[] = [
  { id: 'today', to: '/', label: 'Hoje', icon: <TodayIcon />, end: true },
  { id: 'bills', to: '/contas', label: 'Contas', icon: <BillsIcon /> },
  { id: 'calendar', to: '/calendario', label: 'Calendário', icon: <CalendarIcon /> },
  { id: 'reports', to: '/relatorios', label: 'Relatórios', icon: <ReportsIcon /> },
];
