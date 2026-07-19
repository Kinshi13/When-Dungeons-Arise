import { useEffect, useState } from 'react';
import { shellBreakpoints } from '../tokens/breakpoints';

export type StellaBreakpoint = 'mobile' | 'tablet' | 'desktop';

function resolveBreakpoint(width: number): StellaBreakpoint {
  if (width < parseInt(shellBreakpoints.tablet, 10)) return 'mobile';
  if (width < parseInt(shellBreakpoints.desktop, 10)) return 'tablet';
  return 'desktop';
}

/**
 * Single shared `resize` listener for the whole app, no matter how many
 * components call useBreakpoint() — six call sites used to mean six
 * independent listeners (ResponsiveContainer, StellaParallax, BillsPage,
 * GlobalCalculatorHost, MarkPaidPicker, FinanceEntryDialog), each also
 * re-running its own resolveBreakpoint() on every pixel of a window drag.
 * rAF-throttled so a resize burst collapses to at most one recompute per
 * frame instead of one per 'resize' event.
 */
let listeners: Set<(breakpoint: StellaBreakpoint) => void> | null = null;
let currentBreakpoint: StellaBreakpoint = 'desktop';
let pendingFrame: number | null = null;

function handleWindowResize() {
  if (pendingFrame !== null) return;
  pendingFrame = requestAnimationFrame(() => {
    pendingFrame = null;
    const next = resolveBreakpoint(window.innerWidth);
    if (next === currentBreakpoint) return;
    currentBreakpoint = next;
    listeners?.forEach((listener) => listener(next));
  });
}

function subscribe(listener: (breakpoint: StellaBreakpoint) => void): () => void {
  if (!listeners) {
    listeners = new Set();
    currentBreakpoint = resolveBreakpoint(window.innerWidth);
    window.addEventListener('resize', handleWindowResize, { passive: true });
  }
  listeners.add(listener);
  return () => {
    listeners?.delete(listener);
    if (listeners?.size === 0) {
      window.removeEventListener('resize', handleWindowResize);
      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame);
        pendingFrame = null;
      }
      listeners = null;
    }
  };
}

/**
 * Tracks the current Stella breakpoint (mobile / tablet / desktop) from the
 * shared token thresholds, so layout decisions never hardcode a device size.
 * Desktop starts at 1440px per the Web App Shell spec; tablet covers
 * 768–1439px; mobile is anything below.
 */
export function useBreakpoint(): StellaBreakpoint {
  const [breakpoint, setBreakpoint] = useState<StellaBreakpoint>(() =>
    typeof window === 'undefined' ? 'desktop' : resolveBreakpoint(window.innerWidth),
  );

  useEffect(() => subscribe(setBreakpoint), []);

  return breakpoint;
}
