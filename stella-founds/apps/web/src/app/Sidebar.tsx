import { StellaSidebarNavigation } from '@stella-founds/stella-ui';
import { sidebarNavItems } from '../features/navigation/navItems';
import './Sidebar.css';

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="stella-sidebar">
      {!collapsed && <span className="stella-sidebar__brand">✦ Stella</span>}
      <StellaSidebarNavigation items={sidebarNavItems} collapsed={collapsed} />
    </div>
  );
}
