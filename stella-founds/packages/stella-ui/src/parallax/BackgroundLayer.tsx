import { useMemo } from 'react';
import { StellaParallaxLayer, useParallaxScene, StellaStarParticle } from './engine';
import { generateStarField } from './starField';
import './stellaScene.css';

/**
 * The Stella scene's base layer: sky gradient + distant stars. Always
 * rendered, even under reduced/off motion — "preservar apenas o fundo
 * Stella" (section 10) — the other layers (Decoration/Foreground) hide
 * themselves in that case, this one doesn't.
 */
export type BackgroundLayerProps = Record<string, never>;

export function BackgroundLayer(_props: BackgroundLayerProps) {
  const { layersById } = useParallaxScene();
  const stars = useMemo(() => generateStarField(40, 1), []);

  return (
    <>
      <StellaParallaxLayer
        config={layersById['background-gradient'] ?? { id: 'background-gradient', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
        className="stella-scene-background"
      />
      <StellaParallaxLayer
        config={layersById['distant-stars'] ?? { id: 'distant-stars', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
        className="stella-scene-stars"
      >
        {stars.map((star, index) => (
          <StellaStarParticle key={index} left={star.left} top={star.top} size={star.size} opacity={star.opacity} />
        ))}
      </StellaParallaxLayer>
    </>
  );
}
