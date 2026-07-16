import type { ReactNode } from 'react';
import { useDismissableOverlay } from '../hooks/useDismissableOverlay';
import './StellaBottomSheet.css';

export function StellaBottomSheet({
  title,
  onClose,
  children,
  className = '',
}: {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  useDismissableOverlay(onClose);

  return (
    <div className="stella-bottom-sheet-backdrop" onClick={onClose}>
      <div
        className={`stella-bottom-sheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stella-bottom-sheet__handle" aria-hidden="true" />
        {title && <h2 className="stella-bottom-sheet__title">{title}</h2>}
        <div className="stella-bottom-sheet__body">{children}</div>
      </div>
    </div>
  );
}
