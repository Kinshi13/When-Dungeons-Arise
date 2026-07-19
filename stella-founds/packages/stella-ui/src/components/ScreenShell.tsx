import type { ReactNode } from 'react';
import { StellaSectionHeader } from './StellaSectionHeader';
import './ScreenShell.css';

export function ScreenShell({
  title,
  action,
  hideHeader = false,
  children,
}: {
  title: string;
  action?: ReactNode;
  /** Skip the default title header — for screens (like the Dashboard hero) that render their own richer header as the first child instead. */
  hideHeader?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="screen-shell">
      {!hideHeader && <StellaSectionHeader title={title} action={action} />}
      {children}
    </div>
  );
}
