export interface StellaConstellationNodeProps {
  cx: number;
  cy: number;
  r?: number;
}

/** A single constellation vertex, meant as a child of an <svg> (see StellaConstellationField). */
export function StellaConstellationNode({ cx, cy, r = 0.6 }: StellaConstellationNodeProps) {
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" />;
}
