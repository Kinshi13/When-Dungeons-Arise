import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import './StellaCard.css';

export function StellaCard({
  children,
  className = '',
  interactive = false,
  as: Component = 'div',
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode; interactive?: boolean; as?: ElementType }) {
  const classes = ['stella-card', interactive && 'stella-card--interactive', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}
