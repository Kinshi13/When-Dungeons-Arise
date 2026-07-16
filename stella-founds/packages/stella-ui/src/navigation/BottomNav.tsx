import { NavLink } from 'react-router-dom';
import { TodayIcon, BillsIcon, CalendarIcon, ReportsIcon } from '../icons/NavIcons';
import './BottomNav.css';

const leftLinks = [
  { to: '/', label: 'Hoje', icon: TodayIcon },
  { to: '/contas', label: 'Contas', icon: BillsIcon },
];

const rightLinks = [
  { to: '/calendario', label: 'Calendário', icon: CalendarIcon },
  { to: '/relatorios', label: 'Relatórios', icon: ReportsIcon },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof TodayIcon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
    >
      <Icon />
      <span>{label}</span>
    </NavLink>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {leftLinks.map((link) => (
        <NavItem key={link.to} {...link} />
      ))}
      <div className="bottom-nav__core-slot" aria-hidden="true" />
      {rightLinks.map((link) => (
        <NavItem key={link.to} {...link} />
      ))}
    </nav>
  );
}
