import type { ReactNode } from 'react';
import { useDismissableOverlay } from '../hooks/useDismissableOverlay';
import './StellaDrawer.css';

/**
 * Right-side slide-in drawer — the tablet-breakpoint equivalent of a right
 * panel or bottom sheet. Only mount this while it should be open; ESC and
 * backdrop click both close it via the caller's `onClose`.
 */
export function StellaDrawer({
  id,
  label,
  onClose,
  children,
}: {
  /** Optional id so a trigger button elsewhere can point `aria-controls` at this drawer. */
  id?: string;
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useDismissableOverlay(onClose);

  return (
    <div className="stella-drawer-backdrop" onClick={onClose}>
      <aside
        id={id}
        className="stella-drawer"
        role="dialog"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </aside>
    </div>
  );
}
