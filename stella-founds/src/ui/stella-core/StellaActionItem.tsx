import { forwardRef, type CSSProperties } from 'react';
import type { StellaActionLayout } from './stellaLayout';

interface StellaActionItemProps {
  layout: StellaActionLayout;
  label: string;
  isActive: boolean;
  delay: number;
  duration: number;
  onClick: () => void;
}

export const StellaActionItem = forwardRef<HTMLButtonElement, StellaActionItemProps>(
  function StellaActionItem({ layout, label, isActive, delay, duration, onClick }, ref) {
    const style: CSSProperties = {
      '--tx': `${layout.offsetX}px`,
      '--ty': `${layout.offsetY}px`,
      transitionDelay: `${delay}s`,
      transitionDuration: `${duration}s`,
    } as CSSProperties;

    return (
      <div className={`stella-core__slot${isActive ? ' is-active' : ''}`} style={style}>
        <button
          ref={ref}
          type="button"
          role="menuitem"
          className="stella-core__item"
          tabIndex={isActive ? 0 : -1}
          aria-label={label}
          onClick={onClick}
        >
          {label}
        </button>
      </div>
    );
  },
);
