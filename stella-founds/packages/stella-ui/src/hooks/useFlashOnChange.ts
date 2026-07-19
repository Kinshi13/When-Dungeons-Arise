import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * Tracks whether `value` just changed, for a brief moment — so a dashboard
 * figure can dip and recover instead of snapping straight to the new
 * number when live data updates underneath it. Returns false on the first
 * render (nothing to flash yet) and whenever prefers-reduced-motion is on.
 */
export function useFlashOnChange<T>(value: T, flashMs = 180): boolean {
  const reducedMotion = usePrefersReducedMotion();
  const previous = useRef(value);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    if (previous.current === value) return;
    previous.current = value;
    setIsFlashing(true);
    const timeout = window.setTimeout(() => setIsFlashing(false), flashMs);
    return () => window.clearTimeout(timeout);
  }, [value, flashMs, reducedMotion]);

  useEffect(() => {
    previous.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isFlashing;
}
