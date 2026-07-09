// Config das camadas de parallax da Recepção (Fase 7, etapa H + integração
// do pacote de assets v2 — ver manifest.json do pacote pra depth/maxOffsetPx
// originais, usados aqui como ponto de partida e ajustados visualmente).
// "constellations" continua sendo o canvas do Phaser (estrelas/hotspot), não
// um PNG — a camada de constelação do pacote de assets é só referência pra
// redesenho em SVG (já feito em components/constellations/), conforme o
// README do pacote. As outras 6 (sky/architecture/midground/desk/character/
// foreground) mais a nova "effects" (partículas de luz) agora têm arte real.
export interface ReceptionLayerConfig {
  id: string;
  depth: number;
  maxOffsetPx: number;
  enabled: boolean;
  reducedMotionBehavior: "static" | "hidden";
}

// Ordem = profundidade crescente (mais longe primeiro) — importa pra
// empilhamento visual das camadas PNG entre si (ver ReceptionParallaxLayers,
// que renderiza nesta mesma ordem, sem precisar de z-index por camada).
export const RECEPTION_LAYERS: ReceptionLayerConfig[] = [
  { id: "sky", depth: 0.02, maxOffsetPx: 4, enabled: true, reducedMotionBehavior: "static" },
  { id: "architecture", depth: 0.05, maxOffsetPx: 8, enabled: true, reducedMotionBehavior: "static" },
  { id: "constellations", depth: 0.08, maxOffsetPx: 10, enabled: true, reducedMotionBehavior: "hidden" },
  { id: "midground", depth: 0.09, maxOffsetPx: 12, enabled: true, reducedMotionBehavior: "static" },
  { id: "desk", depth: 0.13, maxOffsetPx: 16, enabled: true, reducedMotionBehavior: "static" },
  { id: "effects", depth: 0.14, maxOffsetPx: 14, enabled: true, reducedMotionBehavior: "hidden" },
  { id: "character", depth: 0.18, maxOffsetPx: 20, enabled: true, reducedMotionBehavior: "static" },
  { id: "foreground", depth: 0.24, maxOffsetPx: 26, enabled: true, reducedMotionBehavior: "static" },
];

// Estilo pronto (calculado 1x, não por frame) que lê --parallax-x/y — as
// custom properties que useReceptionParallax.ts escreve imperativamente a
// cada frame no container (nunca via setState/re-render do React; ver seção
// 15 do briefing: "não atualizar dezenas de componentes React por frame").
// O fallback "0" no var() cobre o instante antes do hook montar/quando o
// parallax está desligado (reduced motion) — nunca fica sem valor.
export function parallaxTransform(layerId: string): { transform: string } | undefined {
  const layer = RECEPTION_LAYERS.find((l) => l.id === layerId);
  if (!layer || !layer.enabled) return undefined;
  const travel = layer.maxOffsetPx;
  return {
    transform: `translate3d(calc(var(--parallax-x, 0) * ${travel}px), calc(var(--parallax-y, 0) * ${travel}px), 0)`,
  };
}
