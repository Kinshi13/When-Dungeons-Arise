import { useMemo } from 'react';
import { StellaParallaxLayer, useParallaxScene, StellaStarParticle } from './engine';
import { generateStarField } from './starField';

/** Nearest scene layer: a sparse dust of foreground particles. Hidden under reduced/off motion, same as DecorationLayer. */
export type ForegroundLayerProps = Record<string, never>;

export function ForegroundLayer(_props: ForegroundLayerProps) {
  const { layersById, motionActive } = useParallaxScene();
  const particles = useMemo(() => generateStarField(10, 7), []);
  if (!motionActive) return null;

  return (
    <StellaParallaxLayer
      config={layersById['foreground-particles'] ?? { id: 'foreground-particles', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
      className="stella-scene-particles"
    >
      {particles.map((particle, index) => (
        <StellaStarParticle
          key={index}
          left={particle.left}
          top={particle.top}
          size={particle.size * 0.8}
          opacity={particle.opacity * 0.6}
        />
      ))}
    </StellaParallaxLayer>
  );
}
