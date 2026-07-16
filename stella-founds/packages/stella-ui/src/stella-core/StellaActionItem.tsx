import { forwardRef, type CSSProperties } from 'react';
import type { StellaConstellationLayout } from './stellaLayout';

interface StellaActionItemProps {
  layout: StellaConstellationLayout;
  label: string;
  isActive: boolean;
  disabled?: boolean;
  delay: number;
  duration: number;
  onClick: () => void;
}

export const StellaActionItem = forwardRef<HTMLButtonElement, StellaActionItemProps>(
  function StellaActionItem({ layout, label, isActive, disabled, delay, duration, onClick }, ref) {
    const style: CSSProperties = {
      '--nx': layout.normalizedX,
      '--ny': layout.normalizedY,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    } as CSSProperties;

    return (
      <div className={`stella-core__slot${isActive ? ' is-active' : ' is-closing'}`} style={style}>
        <button
          ref={ref}
          type="button"
          role="menuitem"
          className="stella-core__item"
          tabIndex={isActive ? 0 : -1}
          aria-label={label}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={onClick}
        >
          {label}
        </button>
      </div>
    );
  },
);
