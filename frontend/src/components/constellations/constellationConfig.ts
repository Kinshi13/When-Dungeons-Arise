import type { LayoutMode } from "../../core/design-system/breakpoints";

export interface ConstellationDensity {
  nodeCount: number;
  // Distância máxima (fração do viewBox 0..100) pra desenhar uma linha
  // entre dois nós — mesmo princípio do campo de estrelas do Phaser
  // (ReceptionScene.ts), aplicado aqui em SVG puro.
  linkDistanceRatio: number;
}

// Mobile: poucas linhas/nós (baixa densidade); tablet: densidade média;
// desktop: campo mais amplo (seção 9 do briefing) — um mapa só, nenhum
// componente recalcula isso por conta própria.
export const CONSTELLATION_DENSITY: Record<LayoutMode, ConstellationDensity> = {
  mobile: { nodeCount: 8, linkDistanceRatio: 0.22 },
  tablet: { nodeCount: 14, linkDistanceRatio: 0.2 },
  desktop: { nodeCount: 22, linkDistanceRatio: 0.16 },
};

export function densityFor(mode: LayoutMode): ConstellationDensity {
  return CONSTELLATION_DENSITY[mode];
}

export interface ConstellationPoint {
  x: number;
  y: number;
  r: number;
}

// PRNG determinístico (mulberry32) — mesmo seed sempre gera a mesma
// composição, então o campo não "reembaralha" a cada render/re-mount.
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateNodes(count: number, seed = 1): ConstellationPoint[] {
  const rand = mulberry32(seed);
  const points: ConstellationPoint[] = [];
  for (let i = 0; i < count; i++) {
    points.push({ x: rand() * 100, y: rand() * 100, r: 0.6 + rand() * 0.8 });
  }
  return points;
}

export function generateLinks(points: ConstellationPoint[], linkDistanceRatio: number): [number, number][] {
  const maxDist = linkDistanceRatio * 100;
  const links: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < maxDist) links.push([i, j]);
    }
  }
  return links;
}
