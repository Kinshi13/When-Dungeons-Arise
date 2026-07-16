import { useState, type ReactNode } from 'react';
import { useDismissableOverlay } from '../hooks/useDismissableOverlay';
import { StellaIconButton } from '../components/StellaIconButton';
import './TabletLayout.css';

/** Tablet app shell: collapsed icon-only sidebar rail, wider content area, and the desktop right panel collapsed into a dismissable drawer. */
export function TabletLayout({
  sidebar,
  header,
  main,
  rightPanel,
  rightPanelLabel = 'Resumo financeiro',
}: {
  sidebar: ReactNode;
  header: ReactNode;
  main: ReactNode;
  rightPanel: ReactNode;
  rightPanelLabel?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  useDismissableOverlay(() => setDrawerOpen(false));

  return (
    <div className="stella-tablet-layout">
      <aside className="stella-tablet-layout__sidebar">{sidebar}</aside>
      <div className="stella-tablet-layout__center">
        <header className="stella-tablet-layout__header">
          {header}
          <StellaIconButton
            icon="☰"
            label={rightPanelLabel}
            active={drawerOpen}
            aria-expanded={drawerOpen}
            aria-controls="stella-right-panel-drawer"
            onClick={() => setDrawerOpen((open) => !open)}
          />
        </header>
        <main className="stella-tablet-layout__main">{main}</main>
      </div>

      {drawerOpen && (
        <div className="stella-tablet-layout__drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside
            id="stella-right-panel-drawer"
            className="stella-tablet-layout__drawer"
            role="dialog"
            aria-label={rightPanelLabel}
            onClick={(event) => event.stopPropagation()}
          >
            {rightPanel}
          </aside>
        </div>
      )}
    </div>
  );
}
