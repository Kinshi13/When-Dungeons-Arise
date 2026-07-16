import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import './StellaBottomNavigation.css';

export interface StellaNavItem {
  id: string;
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

function NavItem({ to, label, icon, end }: StellaNavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `stella-bottom-nav__item${isActive ? ' is-active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/**
 * Generic five-slot bottom navigation shell: an arbitrary list of route
 * items split across a reserved center slot (typically the Stella Core).
 * Route table, labels and icons are supplied by the consuming app — this
 * component owns only the layout, safe-area handling and active state.
 */
export function StellaBottomNavigation({
  items,
  centerSlot,
  ariaLabel = 'Navegação principal',
}: {
  items: StellaNavItem[];
  centerSlot?: ReactNode;
  ariaLabel?: string;
}) {
  const mid = Math.ceil(items.length / 2);
  const leftItems = items.slice(0, mid);
  const rightItems = items.slice(mid);

  return (
    <nav className="stella-bottom-nav" aria-label={ariaLabel}>
      {leftItems.map((item) => (
        <NavItem key={item.id} {...item} />
      ))}
      <div className="stella-bottom-nav__core-slot" aria-hidden={!centerSlot}>
        {centerSlot}
      </div>
      {rightItems.map((item) => (
        <NavItem key={item.id} {...item} />
      ))}
    </nav>
  );
}
