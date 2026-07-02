import { useRef, useState, type TouchEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMotionValue, useTransform, animate } from "framer-motion";
import { useSettings } from "./contexts/SettingsContext";

// Sequência "achatada" de TODAS as 7 telas da barra inferior + suas
// sub-abas, na ordem em que o swipe as percorre (Diário e Biblioteca nas
// pontas, batendo com a posição deles na barra). Sub-telas de uma área
// (como as abas da Tesouraria, ou Notas/Listas do Diário) entram como mais
// passos na mesma sequência — ao chegar na borda de um grupo, o swipe
// continua naturalmente pra área vizinha.
const FLAT_SEQUENCE = [
  "/diario/notas",
  "/diario/listas",
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
  "/biblioteca",
];

const SWIPE_THRESHOLD = 60;
// Mais altos que antes (eram 10 / 1.5x) — em telas com bastante conteúdo pra
// rolar (ex: Ajustes), um toque levemente diagonal no início de uma rolagem
// vertical bastava pra "travar" o gesto como swipe horizontal (a decisão só
// acontece uma vez, no primeiro movimento que passa do limiar) e montar a
// prévia da tela vizinha por engano. Exigir uma diferença bem mais clara
// entre os eixos reduz drasticamente esse falso positivo.
const ACTIVATION_THRESHOLD = 16;
const AXIS_DOMINANCE = 2.2;

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

// Igual sectionOf, mas cobrindo também Diário/Biblioteca — usado só aqui pra
// saber se uma troca na FLAT_SEQUENCE fica "dentro" da mesma área (Finanças
// -> Contas, Notas -> Listas: mesma seção) ou "atravessa" pra uma área
// vizinha (Diário -> Mural, Ajustes -> Biblioteca: seções diferentes). Só
// trocas entre seções diferentes ganham a animação de gaveta.
function flatSequenceSection(pathname: string): string {
  if (pathname.startsWith("/diario")) return "diario";
  if (pathname === "/biblioteca") return "biblioteca";
  return sectionOf(pathname) ?? pathname;
}

// Ordem visual das 7 telas na barra inferior — usada só pra saber de que lado
// a próxima tela deve entrar (direção do slide), não pra navegação em si.
export const MAIN_ORDER = ["diario", "mural", "tesouraria", "guilda", "tempo", "ajustes", "biblioteca"];

interface ResolvedGesture {
  targetPath: string | null;
  // true = troca acompanha o dedo em tempo real (efeito "gaveta de apps").
  animated: boolean;
  direction: number; // -1 ou 1 — de que lado a tela nova entra
  // true = troca fica dentro da mesma área (sub-abas, ex: Finanças/Contas) —
  // só ganha o slide, sem a animação de "subir" da prévia (ver drawer-rise em
  // App.tsx), que só faz sentido pra trocas entre áreas diferentes.
  sameSection: boolean;
}

function resolveGesture(pathname: string, dx: number): ResolvedGesture {
  const direction = dx < 0 ? 1 : -1;

  // Toda troca dentro da sequência (entre as 7 telas da barra OU entre as
  // sub-abas de uma mesma área, como Finanças/Contas/Análises ou Notas/
  // Listas) acompanha o dedo em tempo real, no mesmo estilo "gaveta de apps".
  if (FLAT_SEQUENCE.includes(pathname)) {
    const currentIndex = FLAT_SEQUENCE.indexOf(pathname);
    const nextIndex = dx < 0 ? currentIndex + 1 : currentIndex - 1;
    const targetPath = nextIndex >= 0 && nextIndex < FLAT_SEQUENCE.length ? FLAT_SEQUENCE[nextIndex] : null;
    const sameSection = targetPath !== null && flatSequenceSection(pathname) === flatSequenceSection(targetPath);
    return { targetPath, animated: !!targetPath, direction, sameSection };
  }

  return { targetPath: null, animated: false, direction, sameSection: false };
}

export interface SlidePreview {
  path: string;
  direction: number;
  sameSection: boolean;
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
  const { dragSlideAnimationEnabled } = useSettings();
  const x = useMotionValue(0);
  const [preview, setPreview] = useState<SlidePreview | null>(null);

  // Efeito "gaveta" da prévia (sobe + esmaece) derivado DIRETO da posição real
  // do arraste (x), em vez de um "@keyframes" de duração fixa disparado só
  // uma vez na montagem. Antes, um gesto lento, parcial ou cancelado (ex:
  // uma rolagem vertical que por acaso "travava" como swipe horizontal, ver
  // ACTIVATION_THRESHOLD acima) deixava a animação de tempo fixo terminar
  // sozinha e mostrar o conteúdo da tela vizinha 100% "chegado" — mesmo com
  // o fundo (que É preso à posição real do dedo) praticamente parado, criando
  // o flash de conteúdo errado sobre o fundo antigo. Presa à mesma posição
  // que já governa o fundo, essa prévia nunca pode ficar "à frente" dele.
  const riseY = useTransform(x, (v) => {
    const screenWidth = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1;
    const progress = Math.min(1, Math.abs(v) / screenWidth);
    return 64 * (1 - progress);
  });
  const riseOpacity = useTransform(x, (v) => {
    const screenWidth = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1;
    const progress = Math.min(1, Math.abs(v) / screenWidth);
    return 0.4 + 0.6 * progress;
  });

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
      if (Math.abs(dx) < ACTIVATION_THRESHOLD || Math.abs(dx) < Math.abs(dy) * AXIS_DOMINANCE) return;
      decided.current = true;
      const resolved = resolveGesture(location.pathname, dx);
      targetPath.current = resolved.targetPath;
      // Com a animação de arrastar desligada nas configurações, o gesto
      // continua navegando normalmente (ver o "else if" no onTouchEnd
      // abaixo) — só a prévia acompanhando o dedo fica de fora, trocando de
      // tela na hora em vez de deslizar.
      animated.current = resolved.animated && dragSlideAnimationEnabled;
      direction.current = resolved.direction;

      if (animated.current && resolved.targetPath) {
        setPreview({ path: resolved.targetPath, direction: resolved.direction, sameSection: resolved.sameSection });
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

  return { onTouchStart, onTouchMove, onTouchEnd, x, preview, riseY, riseOpacity };
}
