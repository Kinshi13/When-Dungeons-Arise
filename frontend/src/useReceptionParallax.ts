import { useEffect, useRef, useState, type RefObject } from "react";

export interface ParallaxPointer {
  x: number; // -1 a 1, relativo ao centro do container
  y: number;
}

const ZERO: ParallaxPointer = { x: 0, y: 0 };

// Rastreia a posição do ponteiro (mouse no desktop, toque no mobile) relativa
// ao centro do container, normalizada -1..1 — sem giroscópio de propósito
// (seção 11 do briefing original: "Não implementar giroscópio agora"). Um
// só requestAnimationFrame pendente por vez (nunca múltiplos em paralelo,
// seção 18: "Evitar múltiplos requestAnimationFrame"). Quando `enabled` é
// false (Animações reduzidas), não escuta nada e sempre devolve {0,0} — a
// Recepção nem chega a montar este listener nesse caso.
export function useReceptionParallax(containerRef: RefObject<HTMLElement | null>, enabled: boolean): ParallaxPointer {
  const [pointer, setPointer] = useState<ParallaxPointer>(ZERO);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPointer(ZERO);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    function scheduleUpdate(clientX: number, clientY: number) {
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const rect = el!.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((clientY - rect.top) / rect.height) * 2 - 1;
        setPointer({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      });
    }

    function onMouseMove(e: MouseEvent) {
      scheduleUpdate(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 0) return;
      scheduleUpdate(e.touches[0].clientX, e.touches[0].clientY);
    }

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("touchmove", onTouchMove);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [containerRef, enabled]);

  return pointer;
}
