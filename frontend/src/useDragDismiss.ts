import { useMotionValue, useTransform, useDragControls, type PanInfo, type DragControls } from "framer-motion";

interface DragDismissOptions {
  // Sentido do arrasto que fecha — "up" pra telas que abrem deslizando de
  // baixo pra cima (ex.: ClockScreen), "down" pras demais (convenção comum
  // de "puxar pra baixo fecha").
  direction: "up" | "down";
  onClose: () => void;
}

export interface DragDismissHandle {
  onPointerDown: (e: React.PointerEvent) => void;
}

export interface DragDismissSurface {
  drag: "y";
  dragListener: false;
  dragControls: DragControls;
  dragConstraints: { top: number; bottom: number };
  dragElastic: { top: number; bottom: number };
  onDragEnd: (event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => void;
  style: { y: ReturnType<typeof useMotionValue<number>> };
}

// Distância/velocidade a partir das quais soltar o dedo já fecha, em vez de
// voltar pro repouso — dois jeitos de "confirmar" o gesto (arrastar bastante
// OU soltar rápido mesmo com pouco deslocamento, tipo um "flick").
const DISMISS_OFFSET = 100;
const DISMISS_VELOCITY = 500;

// Gesto de arrastar pra fechar reaproveitado por toda gaveta/sheet do app —
// usa o próprio `drag` do framer-motion (física real de arraste, incluindo
// resistência/mola ao soltar) em vez de recalcular tudo na mão com
// touchstart/move/end, como cada tela fazia isoladamente antes. Expõe
// `backdropOpacity` (derivado da posição real do arrasto, não de um timer)
// pra quem tiver um backdrop separado sincronizar o esmaecimento junto.
//
// `surface` vai no elemento que desliza (o botão/handle pode ser o mesmo
// elemento ou só um cabeçalho — quem chama decide via `handle`, iniciando o
// arrasto por `dragControls.start` em vez de deixar o elemento inteiro
// escutar touch, pra não competir com rolagem de conteúdo por dentro).
export function useDragDismiss({ direction, onClose }: DragDismissOptions) {
  const y = useMotionValue(0);
  const dragControls = useDragControls();
  const sign = direction === "up" ? -1 : 1;

  // 0 em repouso -> 1 no ponto em que soltar já fecha.
  const progress = useTransform(y, (v) => Math.min(1, Math.max(0, (v * sign) / DISMISS_OFFSET)));
  const backdropOpacity = useTransform(progress, (p) => 1 - p);

  function onDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    const offset = info.offset.y * sign;
    const velocity = info.velocity.y * sign;
    if (offset > DISMISS_OFFSET || velocity > DISMISS_VELOCITY) {
      onClose();
    }
    // Se não confirmou, o próprio framer-motion anima de volta pro repouso
    // (dragConstraints), sem precisar de nenhuma mola manual aqui.
  }

  const surface: DragDismissSurface = {
    drag: "y",
    dragListener: false,
    dragControls,
    dragConstraints: { top: 0, bottom: 0 },
    // Elástico só no sentido que fecha — no sentido oposto o arrasto trava
    // logo no início, em vez de "esticar" pra um lugar que não fecha nada.
    dragElastic: { top: direction === "up" ? 1 : 0, bottom: direction === "down" ? 1 : 0 },
    onDragEnd,
    style: { y },
  };

  const handle: DragDismissHandle = {
    onPointerDown: (e) => dragControls.start(e),
  };

  return { surface, handle, backdropOpacity };
}
