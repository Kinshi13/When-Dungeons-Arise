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
    if (startX.current === null || startY.current === null) return;
    // Portais (createPortal) renderizam em outro lugar do DOM, mas continuam
    // sendo filhos na ÁRVORE REACT — e é essa árvore que os eventos
    // sintéticos seguem ao "borbulhar", não o DOM real. Sem isso, um gesto
    // dentro do Relógio/Clima (que a Recepção renderiza como filho, mesmo
    // saindo via portal pra document.body) também acionava o próprio
    // useVerticalSwipe da Recepção por baixo — fechava e reabria na mesma hora.
    // Precisa parar em TODO touchmove daqui em diante (não só no que decide),
    // senão o próximo evento passa direto pro pai antes dele também decidir.
    if (isVertical.current) {
      e.stopPropagation();
      return;
    }
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dy) < ACTIVATION_THRESHOLD || Math.abs(dy) < Math.abs(dx) * 1.5) return;
    isVertical.current = true;
    e.stopPropagation();
  }

  function onTouchEnd(e: TouchEvent) {
    if (!isVertical.current || startY.current === null) {
      reset();
      return;
    }
    e.stopPropagation();
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dy) > SWIPE_THRESHOLD) {
      if (dy < 0) onSwipeUp?.();
      else onSwipeDown?.();
    }
    reset();
  }

  return { onTouchStart, onTouchMove, onTouchEnd };
}
