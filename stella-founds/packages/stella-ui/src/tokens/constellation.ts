export interface StellaConstellationSlot {
  normalizedX: number;
  normalizedY: number;
  animationOrder: number;
  connectionFrom: 'core' | number;
  preferredSide: 'left' | 'right' | 'center';
}

/**
 * Organic branching layout for the default 5-action Stella Core menu
 * (inspired by the App Escala reference): the core sends three branches up —
 * a central one and one to each side — and the two side branches each
 * continue outward to a second node, instead of every action spoking
 * directly off the core.
 */
export const fiveSlotConstellation: StellaConstellationSlot[] = [
  { normalizedX: -1.3, normalizedY: -2.3, animationOrder: 2, connectionFrom: 1, preferredSide: 'left' },
  { normalizedX: -1.05, normalizedY: -0.95, animationOrder: 1, connectionFrom: 'core', preferredSide: 'left' },
  { normalizedX: 0.05, normalizedY: -3.05, animationOrder: 3, connectionFrom: 'core', preferredSide: 'center' },
  { normalizedX: 1.05, normalizedY: -0.95, animationOrder: 4, connectionFrom: 'core', preferredSide: 'right' },
  { normalizedX: 1.3, normalizedY: -2.3, animationOrder: 5, connectionFrom: 3, preferredSide: 'right' },
];

export const constellationFallbackArc = {
  radius: 1.55,
  spreadDeg: 150,
} as const;

export const constellationUnit = {
  base: '70px',
  compact: '56px',
  wide: '88px',
} as const;
