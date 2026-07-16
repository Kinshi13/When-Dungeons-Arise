import type { ReactNode } from 'react';
import './MobileLayout.css';

/** Mobile app shell: stacked content, fixed bottom navigation with the Stella Core reserved in its center slot. */
export function MobileLayout({
  header,
  main,
  bottomNav,
  stellaCore,
}: {
  header: ReactNode;
  main: ReactNode;
  bottomNav: ReactNode;
  stellaCore: ReactNode;
}) {
  return (
    <div className="stella-mobile-layout">
      <header className="stella-mobile-layout__header">{header}</header>
      <main className="stella-mobile-layout__main">{main}</main>
      {stellaCore}
      {bottomNav}
    </div>
  );
}
