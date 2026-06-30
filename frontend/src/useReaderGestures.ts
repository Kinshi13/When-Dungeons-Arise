import { useRef } from "react";

interface GestureHandlers {
  onPrev: () => void;
  onNext: () => void;
  onDoubleTap: () => void;
}

const DOUBLE_TAP_WINDOW_MS = 300;
const SINGLE_TAP_DELAY_MS = 280;
const DOUBLE_TAP_MAX_DISTANCE = 40;

export function useReaderGestures({ onPrev, onNext, onDoubleTap }: GestureHandlers) {
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const pendingTimeout = useRef<number | null>(null);

  function handleTap(clientX: number, clientY: number, containerRect: Pick<DOMRect, "left" | "width">) {
    const now = Date.now();
    const last = lastTap.current;

    if (
      last &&
      now - last.time < DOUBLE_TAP_WINDOW_MS &&
      Math.hypot(clientX - last.x, clientY - last.y) < DOUBLE_TAP_MAX_DISTANCE
    ) {
      if (pendingTimeout.current) {
        clearTimeout(pendingTimeout.current);
        pendingTimeout.current = null;
      }
      lastTap.current = null;
      onDoubleTap();
      return;
    }

    lastTap.current = { time: now, x: clientX, y: clientY };
    pendingTimeout.current = window.setTimeout(() => {
      lastTap.current = null;
      pendingTimeout.current = null;
      const relativeX = clientX - containerRect.left;
      if (relativeX < containerRect.width / 2) {
        onPrev();
      } else {
        onNext();
      }
    }, SINGLE_TAP_DELAY_MS);
  }

  return { handleTap };
}
