interface PixelCharacterIdleProps {
  name: string;
  spriteUrl?: string;
  frameCount?: number;
  fps?: number;
  size?: number;
  /** Largura/altura de cada frame do spritesheet original (1 = quadrado). Evita esticar/achatar
   * personagens cujo frame não é quadrado, ex.: 543x724 -> 543/724. */
  frameAspect?: number;
  color?: string;
}

// Personagem com animação idle. Se receber uma spritesheet (spriteUrl + frameCount),
// anima por steps(); sem spritesheet, usa um placeholder pixelado com "respiração" via CSS,
// pra já funcionar visualmente antes de termos as artes finais dos personagens.
export default function PixelCharacterIdle({
  name,
  spriteUrl,
  frameCount = 1,
  fps = 4,
  size = 96,
  frameAspect = 1,
  color = "var(--accent)",
}: PixelCharacterIdleProps) {
  if (spriteUrl) {
    const width = size * frameAspect;
    return (
      <div
        className="pixel-character-sprite"
        role="img"
        aria-label={name}
        style={
          {
            width,
            height: size,
            backgroundImage: `url(${spriteUrl})`,
            backgroundSize: `${frameCount * 100}% 100%`,
            "--frame-count": frameCount,
            animationDuration: `${frameCount / fps}s`,
          } as React.CSSProperties
        }
      />
    );
  }

  return (
    <svg
      className="pixel-character-placeholder"
      role="img"
      aria-label={name}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color }}
    >
      <rect x="8" y="3" width="8" height="7" fill="currentColor" stroke="var(--border)" strokeWidth="1" />
      <rect x="6" y="10" width="12" height="9" fill="currentColor" stroke="var(--border)" strokeWidth="1" />
      <rect x="6" y="19" width="4" height="3" fill="var(--border)" />
      <rect x="14" y="19" width="4" height="3" fill="var(--border)" />
      <rect x="10" y="6" width="1.5" height="1.5" fill="var(--border)" />
      <rect x="13.5" y="6" width="1.5" height="1.5" fill="var(--border)" />
    </svg>
  );
}
