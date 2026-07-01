import { useRef, type TouchEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMotionValue, animate } from "framer-motion";

// Sequência "achatada" das telas principais + suas sub-abas, na ordem em que o
// swipe percorre a barra inferior. Sub-telas de uma área (como as abas da
// Tesouraria) entram como mais passos na mesma sequência — ao chegar na borda
// de um grupo, o swipe continua naturalmente pra área principal vizinha.
const FLAT_SEQUENCE = [
  "/missoes",
  "/tesouraria/financas",
  "/tesouraria/contas",
  "/tesouraria/calculadora",
  "/tesouraria/porcentagem",
  "/",
  "/sala-do-tempo/calendario",
  "/sala-do-tempo/agenda",
  "/regras",
];

// O Diário fica numa sequência própria, separada da barra inferior (é acessado
// pelo atalho da Recepção, não pelas abas de baixo).
const DIARIO_SEQUENCE = ["/diario/notas", "/diario/listas"];

const SWIPE_THRESHOLD = 60;
const ACTIVATION_THRESHOLD = 10;

// A qual das 5 telas principais da barra inferior uma rota pertence — usado
// pra decidir quando a troca merece a animação de slide (entre telas) e quando
// deve continuar instantânea (entre sub-abas da mesma tela). Rotas fora da
// barra (Diário, Biblioteca, Perfil, Leitor) retornam null.
export function sectionOf(pathname: string): string | null {
  if (pathname === "/") return "guilda";
  if (pathname.startsWith("/missoes")) return "mural";
  if (pathname.startsWith("/tesouraria")) return "tesouraria";
  if (pathname.startsWith("/sala-do-tempo")) return "tempo";
  if (pathname.startsWith("/regras")) return "ajustes";
  return null;
}

// Ordem visual das 5 telas na barra inferior — usada só pra saber de que lado
// a próxima tela deve entrar (direção do slide), não pra navegação em si.
export const MAIN_ORDER = ["mural", "tesouraria", "guilda", "tempo", "ajustes"];

function resolveTarget(pathname: string, dx: number) {
  const sequence = FLAT_SEQUENCE.includes(pathname)
    ? FLAT_SEQUENCE
    : DIARIO_SEQUENCE.includes(pathname)
      ? DIARIO_SEQUENCE
      : null;
  if (!sequence) return { targetPath: null, crossesSection: false };

  const currentIndex = sequence.indexOf(pathname);
  const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
  const targetPath = nextIndex >= 0 && nextIndex < sequence.length ? sequence[nextIndex] : null;
  const crossesSection = sequence === FLAT_SEQUENCE && !!targetPath && sectionOf(targetPath) !== sectionOf(pathname);
  return { targetPath, crossesSection };
}

export function useSwipeNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const x = useMotionValue(0);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const decided = useRef(false);
  const crossesSection = useRef(false);
  const targetPath = useRef<string | null>(null);
  const dragDirection = useRef(0);

  function reset() {
    startX.current = null;
    startY.current = null;
    decided.current = false;
    crossesSection.current = false;
    targetPath.current = null;
    dragDirection.current = 0;
  }

  function onTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchMove(e: TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (!decided.current) {
      if (Math.abs(dx) < ACTIVATION_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      decided.current = true;
      dragDirection.current = dx < 0 ? 1 : -1;
      const resolved = resolveTarget(location.pathname, dx);
      targetPath.current = resolved.targetPath;
      crossesSection.current = resolved.crossesSection;
    }

    // Só a troca ENTRE telas principais acompanha o dedo em tempo real — entre
    // sub-abas da mesma tela o comportamento continua o instantâneo de sempre.
    if (crossesSection.current) {
      x.set(targetPath.current ? dx : dx * 0.3);
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (!decided.current || startX.current === null) {
      reset();
      return;
    }
    const dx = e.changedTouches[0].clientX - startX.current;

    if (crossesSection.current) {
      if (Math.abs(dx) > SWIPE_THRESHOLD && targetPath.current) {
        const dir = dragDirection.current;
        const screenWidth = window.innerWidth;
        const path = targetPath.current;
        animate(x, dir * -screenWidth, { duration: 0.16, ease: "easeIn" }).then(() => {
          x.set(0);
          navigate(path);
        });
      } else {
        animate(x, 0, { type: "spring", stiffness: 420, damping: 40 });
      }
    } else if (Math.abs(dx) > SWIPE_THRESHOLD && targetPath.current) {
      navigate(targetPath.current);
    }

    reset();
  }

  return { onTouchStart, onTouchMove, onTouchEnd, x };
}
