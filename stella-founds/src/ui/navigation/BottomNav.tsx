import { NavLink } from 'react-router-dom';
import { TodayIcon, BillsIcon, CalendarIcon, ReportsIcon } from '../icons/NavIcons';
import './BottomNav.css';

const links = [
  { to: '/', label: 'Hoje', icon: TodayIcon },
  { to: '/contas', label: 'Contas', icon: BillsIcon },
];

const rightLinks = [
  { to: '/calendario', label: 'Calendário', icon: CalendarIcon },
  { to: '/relatorios', label: 'Relatórios', icon: ReportsIcon },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <div className="bottom-nav__group">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
      <div className="bottom-nav__core-spacer" aria-hidden="true" />
      <div className="bottom-nav__group">
        {rightLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav__item${isActive ? ' is-active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
