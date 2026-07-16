import type { ButtonHTMLAttributes } from 'react';
import './StellaButton.css';

export type StellaButtonVariant = 'primary' | 'ghost' | 'danger' | 'chip';

export function StellaButton({
  variant = 'ghost',
  active = false,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: StellaButtonVariant; active?: boolean }) {
  const classes = [
    'stella-button',
    `stella-button--${variant}`,
    active && 'is-active',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type="button" className={classes} {...rest} />;
}
