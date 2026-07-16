import { NavLink } from 'react-router-dom';
import type { StellaNavItem } from './StellaBottomNavigation';
import './StellaSidebarNavigation.css';

/**
 * Vertical navigation for desktop/tablet sidebars. Same `StellaNavItem[]`
 * contract as StellaBottomNavigation — desktop only changes disposition,
 * the route table itself stays the app's responsibility and is not
 * duplicated between the two components.
 */
export function StellaSidebarNavigation({
  items,
  collapsed = false,
  ariaLabel = 'Navegação principal',
}: {
  items: StellaNavItem[];
  collapsed?: boolean;
  ariaLabel?: string;
}) {
  return (
    <nav className={`stella-sidebar-nav${collapsed ? ' is-collapsed' : ''}`} aria-label={ariaLabel}>
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.end}
          aria-label={item.label}
          className={({ isActive }) => `stella-sidebar-nav__item${isActive ? ' is-active' : ''}`}
        >
          <span className="stella-sidebar-nav__icon">{item.icon}</span>
          {!collapsed && <span className="stella-sidebar-nav__label">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}
