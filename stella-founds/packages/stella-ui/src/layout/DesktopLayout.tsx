import type { ReactNode } from 'react';
import './DesktopLayout.css';

/** Desktop app shell: fixed left sidebar, central content area, right summary panel. */
export function DesktopLayout({
  sidebar,
  header,
  main,
  rightPanel,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  main: ReactNode;
  rightPanel: ReactNode;
}) {
  return (
    <div className="stella-desktop-layout">
      <aside className="stella-desktop-layout__sidebar">{sidebar}</aside>
      <div className="stella-desktop-layout__center">
        <header className="stella-desktop-layout__header">{header}</header>
        <main className="stella-desktop-layout__main">{main}</main>
      </div>
      <aside className="stella-desktop-layout__right-panel">{rightPanel}</aside>
    </div>
  );
}
