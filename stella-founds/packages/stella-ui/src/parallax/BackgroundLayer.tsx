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
 *
 * Web Fase 6.6: stars sit in their own inner wrapper carrying a slow
 * ambient drift (see .stella-scene-stars__ambient in stellaScene.css) —
 * separate from the outer StellaParallaxLayer's cursor-follow transform,
 * so the two compose (nested transforms) instead of one fighting the
 * other for the same CSS property. Only animates while `motionActive`.
 */
export type BackgroundLayerProps = Record<string, never>;

export function BackgroundLayer(_props: BackgroundLayerProps) {
  const { layersById, motionActive, quality } = useParallaxScene();
  const stars = useMemo(() => generateStarField(quality.starCount, 1), [quality.starCount]);

  return (
    <StellaParallaxLayer
      config={layersById['distant-stars'] ?? { id: 'distant-stars', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
      className="stella-scene-background stella-scene-stars"
    >
      <div className={`stella-scene-stars__ambient${motionActive ? ' is-active' : ''}`}>
        {stars.map((star, index) => (
          <StellaStarParticle key={index} left={star.left} top={star.top} size={star.size} opacity={star.opacity} />
        ))}
      </div>
    </StellaParallaxLayer>
  );
}
