import type { HTMLAttributes, ReactNode } from 'react';
import './StellaListItem.css';

export function StellaListItem({
  leading,
  title,
  subtitle,
  trailing,
  className = '',
  ...rest
}: HTMLAttributes<HTMLLIElement> & {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <li className={`stella-list-item ${className}`.trim()} {...rest}>
      {leading && <span className="stella-list-item__leading">{leading}</span>}
      <span className="stella-list-item__info">
        <span className="stella-list-item__title">{title}</span>
        {subtitle && <span className="stella-list-item__subtitle">{subtitle}</span>}
      </span>
      {trailing && <span className="stella-list-item__trailing">{trailing}</span>}
    </li>
  );
}
