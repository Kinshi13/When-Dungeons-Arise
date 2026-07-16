import type { ReactNode } from 'react';
import { StellaSectionHeader } from './StellaSectionHeader';
import './ScreenShell.css';

export function ScreenShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="screen-shell">
      <StellaSectionHeader title={title} action={action} />
      {children}
    </div>
  );
}
