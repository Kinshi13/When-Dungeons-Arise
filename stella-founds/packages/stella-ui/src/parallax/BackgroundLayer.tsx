import { useMemo } from 'react';
import { StellaParallaxLayer, useParallaxScene, StellaStarParticle } from './engine';
import { generateStarField } from './starField';
import './stellaScene.css';

/**
 * The Stella scene's base layer: sky gradient + distant stars, sharing a
 * single StellaParallaxLayer wrapper (Web Fase 6.5 merged what used to be
 * two separately-transformed layers — same near-identical depth, so the
 * merge is visually silent). Always rendered, even under reduced/off
 * motion — "preservar apenas o fundo Stella" — the other layers
 * (DecorationLayer) hide themselves in that case, this one doesn't. Star
 * count comes from the scene's quality tier, not a fixed number.
 */
export type BackgroundLayerProps = Record<string, never>;

export function BackgroundLayer(_props: BackgroundLayerProps) {
  const { layersById, quality } = useParallaxScene();
  const stars = useMemo(() => generateStarField(quality.starCount, 1), [quality.starCount]);

  return (
    <StellaParallaxLayer
      config={layersById['distant-stars'] ?? { id: 'distant-stars', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
      className="stella-scene-background stella-scene-stars"
    >
      {stars.map((star, index) => (
        <StellaStarParticle key={index} left={star.left} top={star.top} size={star.size} opacity={star.opacity} />
      ))}
    </StellaParallaxLayer>
  );
}
