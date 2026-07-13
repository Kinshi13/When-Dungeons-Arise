export interface StarPoint {
  left: number;
  top: number;
  size: number;
  opacity: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateStarField(count: number, seed: number): StarPoint[] {
  const random = mulberry32(seed);
  const stars: StarPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      left: random() * 100,
      top: random() * 100,
      size: 1 + random() * 1.6,
      opacity: 0.3 + random() * 0.5,
    });
  }
  return stars;
}
