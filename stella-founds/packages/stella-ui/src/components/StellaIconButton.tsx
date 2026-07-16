import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './StellaIconButton.css';

export function StellaIconButton({
  icon,
  label,
  active = false,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode; label: string; active?: boolean }) {
  const classes = ['stella-icon-button', active && 'is-active', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} aria-label={label} {...rest}>
      {icon}
    </button>
  );
}
