import type { CSSProperties, ReactNode } from 'react';
import type { ParallaxLayerConfig } from './parallax.types';
import { useParallaxScene } from './ParallaxSceneContext';
import './StellaParallaxLayer.css';

/**
 * One depth layer. Reads the ancestor StellaParallax's `--parallax-x`/`-y`
 * (updated once per frame by useParallaxMotion) purely through a CSS
 * calc() transform — this component itself never re-renders on motion,
 * it only sets its own config as custom properties once.
 *
 * Amplitude and opacity come from the scene's quality tier when this
 * layer's id is one of Stella's three known scene layers (distant-stars /
 * constellation-lines / near-decoration) — that's the actual source of
 * truth for "how far this layer travels" per Web Fase 6.6. `config`'s own
 * maxOffsetX/Y/opacity only apply as a fallback, for any other layer id a
 * caller passes in (this component stays generic, it doesn't hardcode
 * Stella's specific scene).
 */
export function StellaParallaxLayer({
  config,
  amplitude,
  className = '',
  children,
}: {
  config: ParallaxLayerConfig;
  /** Explicit override multiplier for maxOffsetX/Y; only used for layer ids the quality tier doesn't know about. */
  amplitude?: number;
  className?: string;
  children?: ReactNode;
}) {
  const { quality } = useParallaxScene();
  if (config.enabled === false) return null;

  const tierLayer = quality.layers[config.id as keyof typeof quality.layers];
  const maxX = tierLayer ? tierLayer.x : config.maxOffsetX * (amplitude ?? 1);
  const maxY = tierLayer ? tierLayer.y : config.maxOffsetY * (amplitude ?? 1);
  const layerOpacity = tierLayer ? tierLayer.opacity : (config.opacity ?? 1);

  const style = {
    '--layer-depth-x': config.depthX,
    '--layer-depth-y': config.depthY,
    '--layer-max-x': `${maxX}px`,
    '--layer-max-y': `${maxY}px`,
    '--layer-scale': config.scale ?? 1,
    '--layer-rotate': `${config.rotate ?? 0}deg`,
    '--layer-opacity': layerOpacity,
    // Omitted entirely (not even set to 0px) when unused — a `filter`
    // property at all, even blur(0px), can push a browser to allocate a
    // separate compositing layer for it. None of the current scene layers
    // use blur, so this keeps every layer on the cheap transform-only path.
    ...(config.blur ? { filter: `blur(${config.blur}px)` } : {}),
    zIndex: config.zIndex,
  } as CSSProperties;

  return (
    <div className={`stella-parallax-layer ${className}`.trim()} style={style} data-layer={config.id} aria-hidden="true">
      {children}
    </div>
  );
}
