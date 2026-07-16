import {
  constellationFallbackArc,
  fiveSlotConstellation,
  type StellaConstellationSlot,
} from '../tokens/constellation';

export type StellaConstellationLayout = StellaConstellationSlot;

function computeFallbackArc(count: number): StellaConstellationLayout[] {
  const { radius, spreadDeg } = constellationFallbackArc;
  const spreadRad = (spreadDeg * Math.PI) / 180;
  if (count === 1) return [{ normalizedX: 0, normalizedY: -radius, animationOrder: 1, connectionFrom: 'core', preferredSide: 'center' }];

  const step = spreadRad / (count - 1);
  const start = -spreadRad / 2;

  return Array.from({ length: count }, (_, i) => {
    const angle = start + step * i;
    return {
      normalizedX: Math.round(radius * Math.sin(angle) * 100) / 100,
      normalizedY: Math.round(-radius * Math.cos(angle) * 100) / 100,
      animationOrder: i + 1,
      connectionFrom: 'core' as const,
      preferredSide: (i < count / 2 ? 'left' : 'right') as 'left' | 'right',
    };
  });
}

export function getStellaConstellationLayouts(count: number): StellaConstellationLayout[] {
  if (count === fiveSlotConstellation.length) return fiveSlotConstellation;
  return computeFallbackArc(count);
}
