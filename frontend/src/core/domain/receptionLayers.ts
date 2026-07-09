// Config das camadas de parallax da Recepção (Fase 7, etapa H — seção 10-11
// do briefing original: sky/architecture/midground/desk/character/
// foreground/constellations, cada uma com profundidade e parallaxFactor
// próprios). Arquitetura pronta pra receber arte em camadas separadas (ver
// STELLA_FOUNDS_FASE7_AUDITORIA.md, seção 7-8) — hoje só "sky" (o gradiente
// de ReceptionBackground) e "constellations" (o canvas do Phaser, que já
// desenha estrelas/linhas) têm um elemento visual de verdade pra mover.
// As outras 5 ficam registradas com enabled:false, sem asset de produção
// ainda, prontas pra ligar quando existirem — sem precisar tocar no hook
// nem no restante da Recepção.
export interface ReceptionLayerConfig {
  id: string;
  depth: number;
  parallaxFactor: number;
  enabled: boolean;
  reducedMotionBehavior: "static" | "hidden";
}

export const RECEPTION_LAYERS: ReceptionLayerConfig[] = [
  { id: "sky", depth: 0, parallaxFactor: 0.02, enabled: true, reducedMotionBehavior: "static" },
  { id: "architecture", depth: 1, parallaxFactor: 0.05, enabled: false, reducedMotionBehavior: "static" },
  { id: "midground", depth: 2, parallaxFactor: 0.1, enabled: false, reducedMotionBehavior: "static" },
  { id: "desk", depth: 3, parallaxFactor: 0.14, enabled: false, reducedMotionBehavior: "static" },
  { id: "character", depth: 4, parallaxFactor: 0.18, enabled: false, reducedMotionBehavior: "static" },
  { id: "foreground", depth: 5, parallaxFactor: 0.25, enabled: false, reducedMotionBehavior: "static" },
  { id: "constellations", depth: 6, parallaxFactor: 0.08, enabled: true, reducedMotionBehavior: "hidden" },
];

// Deslocamento máximo (px) pra um fator 1.0 hipotético — os fatores reais
// (0.02 a 0.25) ficam bem abaixo disso, então o resultado prático é sempre
// um movimento sutil (poucos px), nunca um deslocamento exagerado (seção 11
// do briefing: "Não usar deslocamentos exagerados").
export const RECEPTION_PARALLAX_MAX_TRAVEL_PX = 60;

// Estilo pronto (calculado 1x, não por frame) que lê --parallax-x/y — as
// custom properties que useReceptionParallax.ts escreve imperativamente a
// cada frame no container (nunca via setState/re-render do React; ver seção
// 15 do briefing: "não atualizar dezenas de componentes React por frame").
// O fallback "0" no var() cobre o instante antes do hook montar/quando o
// parallax está desligado (reduced motion) — nunca fica sem valor.
export function parallaxTransform(layerId: string): { transform: string } | undefined {
  const layer = RECEPTION_LAYERS.find((l) => l.id === layerId);
  if (!layer || !layer.enabled) return undefined;
  const travel = RECEPTION_PARALLAX_MAX_TRAVEL_PX * layer.parallaxFactor;
  return {
    transform: `translate3d(calc(var(--parallax-x, 0) * ${travel}px), calc(var(--parallax-y, 0) * ${travel}px), 0)`,
  };
}
