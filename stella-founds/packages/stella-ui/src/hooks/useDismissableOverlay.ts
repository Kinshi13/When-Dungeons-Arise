import { useEffect } from 'react';

/** Closes an overlay (modal, bottom sheet, ...) on Escape. Backdrop-click dismissal is left to the caller's onClick handler since it needs the click target. */
export function useDismissableOverlay(onClose: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}
