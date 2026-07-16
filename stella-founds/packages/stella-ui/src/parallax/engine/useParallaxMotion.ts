import { useEffect, useRef, type RefObject } from 'react';
import type { ParallaxState } from './parallax.types';
import { parallaxMotion } from './parallax.tokens';

/**
 * The motion pipeline: input → dead zone → smoothing (lerp) → CSS custom
 * properties on the target element. A single requestAnimationFrame loop
 * per instance; never calls setState, so React never re-renders on motion.
 * Pauses while the tab is hidden and cancels/cleans up fully on unmount.
 */
export function useParallaxMotion(
  targetRef: RefObject<HTMLElement | null>,
  inputRef: RefObject<ParallaxState>,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    if (!enabled) {
      target.style.setProperty('--parallax-x', '0');
      target.style.setProperty('--parallax-y', '0');
      return;
    }

    let frame: number | null = null;
    let paused = false;

    function applyDeadZone(value: number): number {
      return Math.abs(value) < parallaxMotion.deadZone ? 0 : value;
    }

    function tick() {
      frame = null;
      if (paused) return;

      const input = inputRef.current;
      const targetX = applyDeadZone(input.x);
      const targetY = applyDeadZone(input.y);
      const smoothing = input.active ? parallaxMotion.smoothing : parallaxMotion.idleReturnSmoothing;

      const current = currentRef.current;
      current.x += (targetX - current.x) * smoothing;
      current.y += (targetY - current.y) * smoothing;

      target!.style.setProperty('--parallax-x', current.x.toFixed(4));
      target!.style.setProperty('--parallax-y', current.y.toFixed(4));

      frame = requestAnimationFrame(tick);
    }

    function handleVisibilityChange() {
      paused = document.hidden;
      if (!paused && frame === null) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      target.style.setProperty('--parallax-x', '0');
      target.style.setProperty('--parallax-y', '0');
    };
  }, [targetRef, inputRef, enabled]);
}
