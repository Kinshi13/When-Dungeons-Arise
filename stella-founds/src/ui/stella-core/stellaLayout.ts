export interface StellaActionLayout {
  offsetX: number;
  offsetY: number;
  /** 1-based position in the left-to-right reveal sequence. */
  order: number;
}

/**
 * Organic, asymmetric 5-point constellation template (in px, relative to
 * the Stella Core center, y negative = up). Reused across every screen
 * since each currently exposes exactly 5 contextual actions; screens with
 * a different count fall back to computeFallbackArc below.
 */
const FIVE_SLOT_TEMPLATE: StellaActionLayout[] = [
  { offsetX: -96, offsetY: -112, order: 1 },
  { offsetX: -138, offsetY: -62, order: 2 },
  { offsetX: -6, offsetY: -162, order: 3 },
  { offsetX: 100, offsetY: -100, order: 4 },
  { offsetX: 72, offsetY: -60, order: 5 },
];

function computeFallbackArc(count: number): StellaActionLayout[] {
  const radius = 108;
  const spreadRad = (150 * Math.PI) / 180;
  if (count === 1) return [{ offsetX: 0, offsetY: -radius, order: 1 }];

  const step = spreadRad / (count - 1);
  const start = -spreadRad / 2;

  return Array.from({ length: count }, (_, i) => {
    const angle = start + step * i;
    return {
      offsetX: Math.round(radius * Math.sin(angle)),
      offsetY: Math.round(-radius * Math.cos(angle)),
      order: i + 1,
    };
  });
}

export function getStellaActionLayouts(count: number): StellaActionLayout[] {
  if (count === FIVE_SLOT_TEMPLATE.length) return FIVE_SLOT_TEMPLATE;
  return computeFallbackArc(count);
}
