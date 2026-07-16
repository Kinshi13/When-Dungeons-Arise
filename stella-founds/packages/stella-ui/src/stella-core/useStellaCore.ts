import { useEffect, useRef, useState } from 'react';

export type StellaCorePhase = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Open/close state machine for the Stella Core radial menu: first tap opens,
 * second tap (or outside click, Escape, back button) closes. Contains no
 * knowledge of routing or business actions — `activeContext` is an opaque
 * value (e.g. the current pathname) that, when it changes, forces the menu
 * back to closed so it never stays open across a navigation.
 */
export function useStellaCore({
  activeContext,
  transitionDurationMs,
}: {
  activeContext?: unknown;
  transitionDurationMs: () => number;
}) {
  const [phase, setPhase] = useState<StellaCorePhase>('closed');
  const rootRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const pushedHistoryRef = useRef(false);

  const isVisuallyOpen = phase === 'opening' || phase === 'open';

  function clearPendingTransition() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function openMenu() {
    if (phase !== 'closed') return;
    clearPendingTransition();
    setPhase('opening');
    timeoutRef.current = window.setTimeout(() => setPhase('open'), transitionDurationMs());
    window.history.pushState({ stellaCoreMenu: true }, '');
    pushedHistoryRef.current = true;
  }

  /** Phase transition only — does not touch history. Used by both the
   * normal close path and the popstate handler (which fires *after* the
   * back button has already consumed our pushed history entry). */
  function transitionToClosing() {
    if (phase !== 'open') return;
    clearPendingTransition();
    setPhase('closing');
    timeoutRef.current = window.setTimeout(() => setPhase('closed'), transitionDurationMs());
  }

  function closeMenu() {
    transitionToClosing();
    if (pushedHistoryRef.current) {
      pushedHistoryRef.current = false;
      window.history.back();
    }
  }

  function toggle() {
    if (phase === 'closed') openMenu();
    else if (phase === 'open') closeMenu();
    // Ignore taps while opening/closing so we never stack overlapping timers.
  }

  useEffect(() => {
    clearPendingTransition();
    pushedHistoryRef.current = false;
    setPhase('closed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext]);

  useEffect(() => () => clearPendingTransition(), []);

  useEffect(() => {
    if (phase !== 'open') return;
    firstItemRef.current?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }

    function handlePopState() {
      // The back button (hardware or browser) already consumed the pushed
      // entry by the time this fires, so just transition — calling
      // history.back() again here would skip past the intended screen.
      pushedHistoryRef.current = false;
      transitionToClosing();
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return { phase, isVisuallyOpen, rootRef, firstItemRef, toggle, closeMenu };
}
