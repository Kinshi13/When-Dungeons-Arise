import type { CSSProperties, ReactNode } from 'react';
import type { ParallaxLayerConfig } from './parallax.types';
import { useParallaxScene } from './ParallaxSceneContext';
import './StellaParallaxLayer.css';

/**
 * One depth layer. Reads the ancestor StellaParallax's `--parallax-x`/`-y`
 * (updated once per frame by useParallaxMotion) purely through a CSS
 * calc() transform — this component itself never re-renders on motion,
 * it only sets its own config as custom properties once.
 */
export function StellaParallaxLayer({
  config,
  amplitude,
  className = '',
  children,
}: {
  config: ParallaxLayerConfig;
  /** Multiplier applied on top of maxOffsetX/Y; defaults to the responsive amplitude from the ancestor StellaParallax. */
  amplitude?: number;
  className?: string;
  children?: ReactNode;
}) {
  const { amplitude: contextAmplitude } = useParallaxScene();
  const resolvedAmplitude = amplitude ?? contextAmplitude;
  if (config.enabled === false) return null;

  const style = {
    '--layer-depth-x': config.depthX,
    '--layer-depth-y': config.depthY,
    '--layer-max-x': `${config.maxOffsetX * resolvedAmplitude}px`,
    '--layer-max-y': `${config.maxOffsetY * resolvedAmplitude}px`,
    '--layer-scale': config.scale ?? 1,
    '--layer-rotate': `${config.rotate ?? 0}deg`,
    '--layer-blur': `${config.blur ?? 0}px`,
    '--layer-opacity': config.opacity ?? 1,
    zIndex: config.zIndex,
  } as CSSProperties;

  return (
    <div className={`stella-parallax-layer ${className}`.trim()} style={style} data-layer={config.id} aria-hidden="true">
      {children}
    </div>
  );
}
