import { useEffect, useRef, type RefObject } from 'react';
import type { ParallaxState } from './parallax.types';

function neutralState(): ParallaxState {
  return { x: 0, y: 0, source: 'idle', active: false };
}

/**
 * Tracks pointer/touch position normalized either to the given container's
 * own bounding box, or (in `viewport` mode) to the whole window — center is
 * (0, 0), edges are ±1 either way — and writes the result into a ref (never
 * React state, so this can't cause a per-event re-render). `useParallaxMotion`
 * reads this ref once per frame.
 *
 * `viewport` mode listens on `window` instead of the container itself,
 * which matters for a `position: fixed; pointer-events: none` background
 * layer: an element with pointer-events: none never receives its own
 * pointer events, so a full-viewport background can only track the cursor
 * by listening above itself. This also means it's still safe to be fully
 * click-through — nothing about tracking the cursor requires it to
 * intercept clicks.
 *
 * device-orientation is a valid `ParallaxInputSource` in the type contract
 * but intentionally not wired up yet (no sensor permission prompt this
 * phase) — touch/pointer is the only active input source today.
 */
export function useParallaxInput(
  containerRef: RefObject<HTMLElement | null>,
  { enabled = true, mode = 'container' }: { enabled?: boolean; mode?: 'container' | 'viewport' } = {},
): RefObject<ParallaxState> {
  const stateRef = useRef<ParallaxState>(neutralState());
  const rectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled) {
      stateRef.current = neutralState();
      return;
    }
    const container = mode === 'container' ? containerRef.current : null;
    if (mode === 'container' && !container) return;

    function refreshRect() {
      if (mode === 'viewport') {
        rectRef.current = new DOMRect(0, 0, window.innerWidth, window.innerHeight);
      } else {
        rectRef.current = container!.getBoundingClientRect();
      }
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

    const target: EventTarget = mode === 'viewport' ? window : container!;
    target.addEventListener('pointermove', handlePointerMove as EventListener, { passive: true });
    if (mode === 'container') {
      target.addEventListener('pointerleave', handlePointerLeave as EventListener, { passive: true });
    }
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      target.removeEventListener('pointermove', handlePointerMove as EventListener);
      if (mode === 'container') {
        target.removeEventListener('pointerleave', handlePointerLeave as EventListener);
      }
      window.removeEventListener('resize', handleResize);
      stateRef.current = neutralState();
    };
  }, [containerRef, enabled, mode]);

  return stateRef;
}
