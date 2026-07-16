import type { HTMLAttributes, ReactNode } from 'react';
import './StellaBadge.css';

export type StellaBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function StellaBadge({
  children,
  tone = 'neutral',
  className = '',
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { children: ReactNode; tone?: StellaBadgeTone }) {
  const classes = ['stella-badge', `stella-badge--${tone}`, className].filter(Boolean).join(' ');
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
