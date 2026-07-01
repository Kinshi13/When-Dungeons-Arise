import { useRef, type TouchEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Sequências de navegação por swipe. Sub-telas de uma área (como as abas da
// Tesouraria) entram como mais passos na mesma sequência — ao chegar na borda
// de um grupo, o swipe continua naturalmente pra área principal vizinha na
// barra inferior. O Diário fica numa sequência própria, separada da barra
// inferior (é acessado pelo atalho da Recepção, não pelas abas de baixo).
const SEQUENCES: string[][] = [
  [
    "/missoes",
    "/tesouraria/financas",
    "/tesouraria/contas",
    "/tesouraria/calculadora",
    "/tesouraria/porcentagem",
    "/",
    "/sala-do-tempo/calendario",
    "/sala-do-tempo/agenda",
    "/regras",
  ],
  ["/diario/notas", "/diario/listas"],
];

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

    const sequence = SEQUENCES.find((seq) => seq.includes(location.pathname));
    if (!sequence) return;

    const currentIndex = sequence.indexOf(location.pathname);
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0 || nextIndex >= sequence.length) return;

    navigate(sequence[nextIndex]);
  }

  return { onTouchStart, onTouchEnd };
}
