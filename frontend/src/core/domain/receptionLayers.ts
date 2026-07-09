// Config das camadas de parallax da Recepção (Fase 7, etapa H — depth/
// maxOffsetPx vêm do manifest.json do pacote de assets v2, mantidos como
// referência mesmo com a camada desligada). "constellations" é o canvas do
// Phaser (estrelas/hotspot), não um PNG — a camada de constelação do
// pacote é só referência pra redesenho em SVG (já feito em
// components/constellations/), conforme o README do pacote.
//
// IMPORTANTE (rollback da integração do pacote v2): os PNGs de
// architecture/midground/desk/character/foreground eram strips de
// referência recortadas independentemente, sem canvas/coordenadas
// compartilhadas entre si — empilhá-los fragmentava a composição em vez
// de reconstruí-la. Ficam com enabled:false até chegar arte de produção
// de verdade que passe em validateProductionLayers (ver
// receptionLayerAssets.ts) — os slots continuam aqui, prontos pra ligar
// sem precisar tocar no hook nem no restante da Recepção. "sky" continua
// ligada porque dirige o parallax do PRÓPRIO degradê (não do sky.png);
// "effects" e "constellations" continuam ligadas por serem camadas
// independentes que não precisam de registro/alinhamento com as outras.
export interface ReceptionLayerConfig {
  id: string;
  depth: number;
  maxOffsetPx: number;
  enabled: boolean;
  reducedMotionBehavior: "static" | "hidden";
}

// Ordem = profundidade crescente (mais longe primeiro).
export const RECEPTION_LAYERS: ReceptionLayerConfig[] = [
  { id: "sky", depth: 0.02, maxOffsetPx: 4, enabled: true, reducedMotionBehavior: "static" },
  { id: "architecture", depth: 0.05, maxOffsetPx: 8, enabled: false, reducedMotionBehavior: "static" },
  { id: "constellations", depth: 0.08, maxOffsetPx: 10, enabled: true, reducedMotionBehavior: "hidden" },
  { id: "midground", depth: 0.09, maxOffsetPx: 12, enabled: false, reducedMotionBehavior: "static" },
  { id: "desk", depth: 0.13, maxOffsetPx: 16, enabled: false, reducedMotionBehavior: "static" },
  { id: "effects", depth: 0.14, maxOffsetPx: 14, enabled: true, reducedMotionBehavior: "hidden" },
  { id: "character", depth: 0.18, maxOffsetPx: 20, enabled: false, reducedMotionBehavior: "static" },
  { id: "foreground", depth: 0.24, maxOffsetPx: 26, enabled: false, reducedMotionBehavior: "static" },
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
