import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { fade, slide } from '../motion/primitives';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * Fades + gently slides a page's content in on mount/route change, using the
 * shared motion tokens. Runs in useLayoutEffect (before paint) so the first
 * animation frame is already applied by the time the browser paints —
 * useEffect would let one frame of full-opacity content flash through first.
 * No-ops entirely under prefers-reduced-motion.
 */
export function PageTransition({ children, transitionKey }: { children: ReactNode; transitionKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reducedMotion || !ref.current) return;
    fade(ref.current, 'in');
    slide(ref.current, 'in', 'y', 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey, reducedMotion]);

  return <div ref={ref}>{children}</div>;
}
