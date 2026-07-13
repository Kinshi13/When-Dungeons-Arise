import type { ReactNode } from 'react';
import './ScreenShell.css';

export function ScreenShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="screen-shell">
      <h1 className="screen-shell__title">{title}</h1>
      {children}
    </div>
  );
}
