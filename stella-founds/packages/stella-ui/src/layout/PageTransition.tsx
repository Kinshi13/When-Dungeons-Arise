import { useEffect, useRef, type ReactNode } from 'react';
import { fade, slide } from '../motion/primitives';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/** Fades + gently slides a page's content in on mount/route change, using the shared motion tokens. No-ops entirely under prefers-reduced-motion. */
export function PageTransition({ children, transitionKey }: { children: ReactNode; transitionKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    fade(ref.current, 'in');
    slide(ref.current, 'in', 'y', 12);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey, reducedMotion]);

  return <div ref={ref}>{children}</div>;
}
