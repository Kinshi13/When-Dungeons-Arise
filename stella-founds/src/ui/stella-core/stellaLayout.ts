export interface StellaConstellationLayout {
  /** Position relative to the Stella Core, in constellation units (1 unit = --stella-unit px). */
  normalizedX: number;
  normalizedY: number;
  /** 1-based reveal order; a node's connectionFrom must have a lower order. */
  animationOrder: number;
  /** 'core' or the array index of another layout entry this branches from. */
  connectionFrom: 'core' | number;
  preferredSide: 'left' | 'right' | 'center';
}

/**
 * Organic branching constellation (inspired by the App Escala reference):
 * the core sends three branches up — a central one and one to each side —
 * and the two side branches each continue outward to a second node,
 * instead of every action spoking directly off the core.
 *
 * Index order matches getStellaCoreActions() for every route (5 actions
 * each): [0]=lower-left, [1]=mid-left, [2]=top/center, [3]=mid-right,
 * [4]=lower-right.
 */
const FIVE_SLOT_TEMPLATE: StellaConstellationLayout[] = [
  { normalizedX: -1.3, normalizedY: -2.3, animationOrder: 2, connectionFrom: 1, preferredSide: 'left' },
  { normalizedX: -1.05, normalizedY: -0.95, animationOrder: 1, connectionFrom: 'core', preferredSide: 'left' },
  { normalizedX: 0.05, normalizedY: -3.05, animationOrder: 3, connectionFrom: 'core', preferredSide: 'center' },
  { normalizedX: 1.05, normalizedY: -0.95, animationOrder: 4, connectionFrom: 'core', preferredSide: 'right' },
  { normalizedX: 1.3, normalizedY: -2.3, animationOrder: 5, connectionFrom: 3, preferredSide: 'right' },
];

function computeFallbackArc(count: number): StellaConstellationLayout[] {
  const radius = 1.55;
  const spreadRad = (150 * Math.PI) / 180;
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
  if (count === FIVE_SLOT_TEMPLATE.length) return FIVE_SLOT_TEMPLATE;
  return computeFallbackArc(count);
}
