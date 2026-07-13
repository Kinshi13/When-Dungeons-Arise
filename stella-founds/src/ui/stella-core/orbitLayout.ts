export interface OrbitPoint {
  x: number;
  y: number;
}

const RADIUS = 108;
const SPREAD_DEGREES = 150;

/** Positions items on an upward-facing arc centered above the origin. */
export function computeOrbitPositions(count: number): OrbitPoint[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 0, y: -RADIUS }];

  const spreadRad = (SPREAD_DEGREES * Math.PI) / 180;
  const step = spreadRad / (count - 1);
  const start = -spreadRad / 2;

  return Array.from({ length: count }, (_, i) => {
    const angle = start + step * i;
    return {
      x: Math.round(RADIUS * Math.sin(angle)),
      y: Math.round(-RADIUS * Math.cos(angle)),
    };
  });
}
