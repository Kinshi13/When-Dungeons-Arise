import { useRef, useState, type TouchEvent } from "react";
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
  "/tesouraria/analises",
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

// Duração fixa e curta, mas com uma curva que acelera suave em vez de soltar
// o freio de vez (easeIn) — evita tanto a sensação rígida/mecânica quanto o
// risco de uma mola "solta" demorar demais pra assentar num arrasto rápido.
const COMMIT_TRANSITION = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };
// No cancelamento a distância até 0 é sempre curta, então uma mola aqui
// assenta rápido e ainda aproveita a velocidade do gesto pra continuar fluida.
const CANCEL_TRANSITION = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.6 };

// A qual das 5 telas principais da barra inferior uma rota pertence — usado
// pra escolher o fundo/conteúdo "representante" da área durante a prévia de
// arraste. Rotas fora da barra (Diário, Biblioteca, Perfil, Leitor) retornam null.
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

interface ResolvedGesture {
  targetPath: string | null;
  // true = troca acompanha o dedo em tempo real e ganha a animação de slide
  // completa (entre telas principais, ou saindo do Diário/Biblioteca de volta
  // pra Recepção); false = troca instantânea de sempre (sub-abas).
  animated: boolean;
  direction: number; // -1 ou 1 — de que lado a tela nova entra
}

function resolveGesture(pathname: string, dx: number): ResolvedGesture {
  const direction = dx < 0 ? 1 : -1;

  // Biblioteca não tem sub-abas — arrastar pra esquerda sempre volta pra
  // Recepção (reverso do toque na lateral direita usado pra entrar).
  if (pathname === "/biblioteca") {
    return dx < 0 ? { targetPath: "/", animated: true, direction } : { targetPath: null, animated: false, direction };
  }

  // Diário tem duas sub-abas que continuam navegando normalmente entre si —
  // a troca entre elas também acompanha o dedo (efeito "gaveta de apps"); só
  // na borda inicial (Notas, arrastando pra direita) o gesto vira "sair" de
  // volta pra Recepção (reverso do toque na lateral esquerda usado pra entrar).
  if (DIARIO_SEQUENCE.includes(pathname)) {
    const currentIndex = DIARIO_SEQUENCE.indexOf(pathname);
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < DIARIO_SEQUENCE.length) {
      return { targetPath: DIARIO_SEQUENCE[nextIndex], animated: true, direction };
    }
    if (dx > 0) {
      return { targetPath: "/", animated: true, direction };
    }
    return { targetPath: null, animated: false, direction };
  }

  // Toda troca dentro da sequência (entre telas principais OU entre as
  // sub-abas de uma mesma área, como Finanças/Contas/Análises) acompanha o
  // dedo em tempo real, no mesmo estilo "gaveta de apps".
  if (FLAT_SEQUENCE.includes(pathname)) {
    const currentIndex = FLAT_SEQUENCE.indexOf(pathname);
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    const targetPath = nextIndex >= 0 && nextIndex < FLAT_SEQUENCE.length ? FLAT_SEQUENCE[nextIndex] : null;
    return { targetPath, animated: !!targetPath, direction };
  }

  return { targetPath: null, animated: false, direction };
}

export interface SlidePreview {
  path: string;
  direction: number;
}

// Objeto simples em escopo de módulo (não um useRef) — como só existe uma
// instância do hook (chamada uma vez em App.tsx), isso funciona como um
// singleton e permite que OUTROS componentes (como os ícones de atalho da
// Recepção, que navegam por tap e não por arraste) também "informem" de que
// lado a próxima tela deve entrar, sem precisar de Context.
export const pendingSwipeDirection = { current: 0 };

// Marcado no commit de um arraste: a tela nova já entrou "puxada pelo dedo"
// (a prévia terminou exatamente na posição final), então a animação de
// entrada pós-navegação deve ser pulada — sem isso a tela deslizava DUAS
// vezes em sequência (uma no arraste, outra ao assentar a rota).
export const skipNextEnterAnimation = { current: false };

export function useSwipeNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const x = useMotionValue(0);
  const [preview, setPreview] = useState<SlidePreview | null>(null);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const decided = useRef(false);
  const animated = useRef(false);
  const targetPath = useRef<string | null>(null);
  const direction = useRef(0);

  function reset() {
    startX.current = null;
    startY.current = null;
    decided.current = false;
    animated.current = false;
    targetPath.current = null;
    direction.current = 0;
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
      const resolved = resolveGesture(location.pathname, dx);
      targetPath.current = resolved.targetPath;
      animated.current = resolved.animated;
      direction.current = resolved.direction;

      if (resolved.animated && resolved.targetPath) {
        setPreview({ path: resolved.targetPath, direction: resolved.direction });
      }
    }

    if (animated.current) {
      x.set(targetPath.current ? dx : dx * 0.3);
    }
  }

  function onTouchEnd(e: TouchEvent) {
    if (!decided.current || startX.current === null) {
      reset();
      return;
    }
    const dx = e.changedTouches[0].clientX - startX.current;

    if (animated.current) {
      if (Math.abs(dx) > SWIPE_THRESHOLD && targetPath.current) {
        const dir = direction.current;
        const screenWidth = window.innerWidth;
        const path = targetPath.current;
        animate(x, dir * -screenWidth, COMMIT_TRANSITION).then(() => {
          x.set(0);
          setPreview(null);
          skipNextEnterAnimation.current = true;
          navigate(path);
        });
      } else {
        animate(x, 0, { ...CANCEL_TRANSITION, velocity: x.getVelocity() });
        setPreview(null);
      }
    } else if (Math.abs(dx) > SWIPE_THRESHOLD && targetPath.current) {
      navigate(targetPath.current);
    }

    reset();
  }

  return { onTouchStart, onTouchMove, onTouchEnd, x, preview };
}
