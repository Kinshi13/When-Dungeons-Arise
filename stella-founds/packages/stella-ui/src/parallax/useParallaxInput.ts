import { useEffect, type RefObject } from 'react';

/**
 * Writes normalized pointer/touch position to CSS custom properties
 * (--parallax-x, --parallax-y) on the given container, throttled to one
 * update per animation frame. Never touches React state, so it can't
 * trigger a re-render per pointer event.
 */
export function useParallaxInput(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let frame: number | null = null;
    let targetX = 0;
    let targetY = 0;

    function apply() {
      frame = null;
      container?.style.setProperty('--parallax-x', targetX.toFixed(4));
      container?.style.setProperty('--parallax-y', targetY.toFixed(4));
    }

    function schedule() {
      if (frame === null) {
        frame = requestAnimationFrame(apply);
      }
    }

    function setTarget(clientX: number, clientY: number) {
      targetX = (clientX / window.innerWidth) * 2 - 1;
      targetY = (clientY / window.innerHeight) * 2 - 1;
      schedule();
    }

    function handlePointerMove(event: PointerEvent) {
      setTarget(event.clientX, event.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;
      setTarget(touch.clientX, touch.clientY);
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [containerRef]);
}
