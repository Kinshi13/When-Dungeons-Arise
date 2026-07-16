import type { HTMLAttributes, ReactNode } from 'react';
import { StellaCard } from './StellaCard';
import './StellaGlassCard.css';

/** StellaCard variant using the heavier translucent "glass" surface instead of the default card surface. */
export function StellaGlassCard({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <StellaCard className={`stella-glass-card ${className}`.trim()} {...rest}>
      {children}
    </StellaCard>
  );
}
