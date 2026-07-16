import { useEffect, useRef, type RefObject } from 'react';
import type { ParallaxState } from './parallax.types';

function neutralState(): ParallaxState {
  return { x: 0, y: 0, source: 'idle', active: false };
}

/**
 * Tracks pointer/touch position normalized to the given container's own
 * bounding box — center of the container is (0, 0), its edges are ±1 — and
 * writes the result into a ref (never React state, so this can't cause a
 * per-event re-render). `useParallaxMotion` reads this ref once per frame.
 *
 * device-orientation is a valid `ParallaxInputSource` in the type contract
 * but intentionally not wired up yet (no sensor permission prompt this
 * phase) — touch/pointer is the only active input source today.
 */
export function useParallaxInput(
  containerRef: RefObject<HTMLElement | null>,
  { enabled = true }: { enabled?: boolean } = {},
): RefObject<ParallaxState> {
  const stateRef = useRef<ParallaxState>(neutralState());
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled) {
      stateRef.current = neutralState();
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    function refreshRect() {
      rectRef.current = container!.getBoundingClientRect();
    }
    refreshRect();

    function setFromClientPoint(clientX: number, clientY: number, source: ParallaxState['source']) {
      const rect = rectRef.current;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((clientY - rect.top) / rect.height) * 2 - 1;
      stateRef.current = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
        source,
        active: true,
      };
    }

    function handlePointerMove(event: PointerEvent) {
      setFromClientPoint(event.clientX, event.clientY, event.pointerType === 'touch' ? 'touch' : 'pointer');
    }

    function handlePointerLeave() {
      stateRef.current = { ...neutralState(), source: stateRef.current.source };
    }

    function handleResize() {
      refreshRect();
    }

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
      stateRef.current = neutralState();
    };
  }, [containerRef, enabled]);

  return stateRef;
}
