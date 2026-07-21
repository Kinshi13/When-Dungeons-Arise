import { StellaSidebarNavigation } from '@stella-founds/stella-ui';
import { sidebarNavItems } from '../features/navigation/navItems';
import './Sidebar.css';

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="stella-sidebar">
      {!collapsed && (
        <div className="stella-sidebar__brand-block">
          <span className="stella-sidebar__brand">✦ Stella</span>
          {/* Purely decorative — no navigation, no other modules actually
              exist yet. Just a visual hint that Founds is one piece of a
              larger Atlas, per Web Fase 6.8 section 14. */}
          <span className="stella-sidebar__tagline">Founds · um módulo do Atlas</span>
        </div>
      )}
      <StellaSidebarNavigation items={sidebarNavItems} collapsed={collapsed} />
    </div>
  );
}
