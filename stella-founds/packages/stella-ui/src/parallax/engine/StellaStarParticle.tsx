export interface StellaStarParticleProps {
  left: number;
  top: number;
  size: number;
  opacity: number;
}

/** A single decorative star/dust dot. Pure, stateless, cheap — safe to render dozens of times. */
export function StellaStarParticle({ left, top, size, opacity }: StellaStarParticleProps) {
  return (
    <span
      className="stella-star-particle"
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        opacity,
        borderRadius: '50%',
        background: 'currentColor',
      }}
    />
  );
}
