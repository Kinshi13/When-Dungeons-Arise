import type { InputHTMLAttributes } from 'react';
import './StellaInput.css';

export function StellaInput({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`stella-input ${className}`.trim()} {...rest} />;
}
