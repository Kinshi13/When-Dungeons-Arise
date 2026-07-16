import type { SelectHTMLAttributes } from 'react';
import './StellaInput.css';

export function StellaSelect({
  className = '',
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`stella-input ${className}`.trim()} {...rest} />;
}
