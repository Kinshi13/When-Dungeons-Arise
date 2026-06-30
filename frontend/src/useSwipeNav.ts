import { useRef, type TouchEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_ROUTES = ["/missoes", "/tesouraria", "/", "/sala-do-tempo", "/diario"];

const SWIPE_THRESHOLD = 60;

export function useSwipeNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function onTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    startY.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const currentIndex = TAB_ROUTES.indexOf(location.pathname);
    if (currentIndex === -1) return;

    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= TAB_ROUTES.length) return;

    navigate(TAB_ROUTES[nextIndex]);
  }

  return { onTouchStart, onTouchEnd };
}
