import { useRef, type TouchEvent } from "react";

const ACTIVATION_THRESHOLD = 10;
const SWIPE_THRESHOLD = 50;

export interface VerticalSwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

// Gesto vertical (abrir/fechar Relógio e Clima) totalmente independente do
// swipe horizontal entre abas (useSwipeNav): cada um só "decide" a própria
// direção quando o arraste é claramente dominante nela (a checagem de
// proporção dy/dx aqui espelha a checagem dx/dy que já existe lá pro sentido
// contrário), então os dois convivem na mesma área sem nunca disputar o
// mesmo gesto — um sempre fica de fora quando o outro assume.
export function useVerticalSwipe(onSwipeUp?: () => void, onSwipeDown?: () => void): VerticalSwipeHandlers {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const isVertical = useRef(false);

  function reset() {
    startX.current = null;
    startY.current = null;
    isVertical.current = false;
  }

  function onTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isVertical.current = false;
  }

  function onTouchMove(e: TouchEvent) {
    if (startX.current === null || startY.current === null || isVertical.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dy) < ACTIVATION_THRESHOLD || Math.abs(dy) < Math.abs(dx) * 1.5) return;
    isVertical.current = true;
  }

  function onTouchEnd(e: TouchEvent) {
    if (!isVertical.current || startY.current === null) {
      reset();
      return;
    }
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dy) > SWIPE_THRESHOLD) {
      if (dy < 0) onSwipeUp?.();
      else onSwipeDown?.();
    }
    reset();
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}
