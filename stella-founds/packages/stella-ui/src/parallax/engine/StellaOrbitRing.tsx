import type { CSSProperties } from 'react';

export interface StellaOrbitRingProps {
  size: string;
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  opacity?: number;
}

/** A soft circular ring outline — one of Stella's "orbital-rings" decorations. Purely presentational, no state. */
export function StellaOrbitRing({ size, left, right, top, bottom, opacity = 0.12 }: StellaOrbitRingProps) {
  const style: CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    left,
    right,
    top,
    bottom,
    borderRadius: '50%',
    border: '1px solid currentColor',
    opacity,
  };
  return <span className="stella-orbit-ring" style={style} />;
}
