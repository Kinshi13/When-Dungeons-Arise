import { useRef, type ReactNode, type TouchEvent } from 'react';
import { useDismissableOverlay } from '../hooks/useDismissableOverlay';
import './StellaBottomSheet.css';

const CLOSE_THRESHOLD_PX = 80;

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
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  function handleTouchStart(event: TouchEvent) {
    dragStartY.current = event.touches[0]?.clientY ?? null;
    sheetRef.current?.classList.add('is-dragging');
  }

  function handleTouchMove(event: TouchEvent) {
    if (dragStartY.current === null || !sheetRef.current) return;
    const delta = event.touches[0].clientY - dragStartY.current;
    if (delta <= 0) return; // only downward drag closes the sheet
    sheetRef.current.style.transform = `translateY(${delta}px)`;
  }

  function handleTouchEnd(event: TouchEvent) {
    const sheet = sheetRef.current;
    if (!sheet || dragStartY.current === null) return;
    const delta = (event.changedTouches[0]?.clientY ?? dragStartY.current) - dragStartY.current;
    sheet.classList.remove('is-dragging');
    dragStartY.current = null;

    if (delta > CLOSE_THRESHOLD_PX) {
      sheet.style.transform = `translateY(100%)`;
      onClose();
      return;
    }
    sheet.style.transform = '';
  }

  return (
    <div className="stella-bottom-sheet-backdrop" onClick={onClose}>
      <div
        ref={sheetRef}
        className={`stella-bottom-sheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="stella-bottom-sheet__handle"
          aria-hidden="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {title && <h2 className="stella-bottom-sheet__title">{title}</h2>}
        <div className="stella-bottom-sheet__body">{children}</div>
      </div>
    </div>
  );
}
