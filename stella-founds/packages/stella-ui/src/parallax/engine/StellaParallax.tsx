import { useMemo, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useBreakpoint } from '../../layout/useBreakpoint';
import { parallaxAmplitudeByBreakpoint } from './parallax.tokens';
import { useParallaxInput } from './useParallaxInput';
import { useParallaxMotion } from './useParallaxMotion';
import { ParallaxSceneProvider } from './ParallaxSceneContext';
import type { StellaParallaxProps } from './parallax.types';
import './StellaParallax.css';

/**
 * Root parallax scene container. Knows nothing about finance, routes, or
 * pages — just measures input over its own bounds, smooths it, and exposes
 * `--parallax-x`/`--parallax-y` custom properties plus the resolved layer
 * configs (by id, via context) to whatever StellaParallaxLayer children
 * render inside it.
 */
export function StellaParallax({
  layers,
  enabled = true,
  reducedMotion,
  motionMode = 'full',
  fixed = false,
  className = '',
  children,
}: StellaParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const systemReducedMotion = usePrefersReducedMotion();
  const breakpoint = useBreakpoint();

  const isMotionActive = enabled && motionMode === 'full' && !reducedMotion && !systemReducedMotion;

  const inputRef = useParallaxInput(containerRef, { enabled: isMotionActive });
  useParallaxMotion(containerRef, inputRef, { enabled: isMotionActive });

  const amplitude = parallaxAmplitudeByBreakpoint[breakpoint];
  const layersById = useMemo(
    () => Object.fromEntries(layers.map((layer) => [layer.id, layer])),
    [layers],
  );

  const classes = ['stella-parallax-scene', fixed && 'stella-parallax-scene--fixed', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} ref={containerRef}>
      <ParallaxSceneProvider value={{ layersById, amplitude, motionActive: isMotionActive }}>
        {children}
      </ParallaxSceneProvider>
    </div>
  );
}
