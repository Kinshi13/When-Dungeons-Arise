import type { ReactNode } from 'react';
import './StellaSectionHeader.css';

export function StellaSectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="stella-section-header">
      <h1 className="stella-section-header__title">{title}</h1>
      {action}
    </div>
  );
}
