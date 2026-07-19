import { useEffect, useMemo, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useParallaxInput } from './useParallaxInput';
import { useParallaxMotion } from './useParallaxMotion';
import { useParallaxQuality } from './useParallaxQuality';
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
  const quality = useParallaxQuality();

  const isMotionActive =
    enabled && motionMode === 'full' && !reducedMotion && !systemReducedMotion && quality.tier !== 'reduced';

  // Fixed (viewport-pinned) scenes are pointer-events:none, so they can
  // only track the cursor via a window-level listener — see
  // useParallaxInput's `mode` doc comment.
  const inputRef = useParallaxInput(containerRef, {
    enabled: isMotionActive,
    mode: fixed ? 'viewport' : 'container',
  });
  useParallaxMotion(containerRef, inputRef, { enabled: isMotionActive });

  const layersById = useMemo(
    () => Object.fromEntries(layers.map((layer) => [layer.id, layer])),
    [layers],
  );

  // Exposes the current tier as both a data-attribute (for CSS like
  // `:root[data-parallax-quality="low"] { ... }`, e.g. Stella Core's glow)
  // and as the exact named CSS custom properties from the Fase 6.6 brief —
  // not the render path itself (StellaParallaxLayer sets its own inline
  // --layer-max-x/y directly from `quality`, see that component), but a
  // live, inspectable mirror of it in devtools for diagnosis, and the one
  // place other components (StellaCore) can read --core-glow-strength from.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.parallaxQuality = quality.tier;
    root.style.setProperty('--parallax-stars-x', `${quality.layers['distant-stars'].x}px`);
    root.style.setProperty('--parallax-stars-y', `${quality.layers['distant-stars'].y}px`);
    root.style.setProperty('--parallax-lines-x', `${quality.layers['constellation-lines'].x}px`);
    root.style.setProperty('--parallax-lines-y', `${quality.layers['constellation-lines'].y}px`);
    root.style.setProperty('--parallax-near-x', `${quality.layers['near-decoration'].x}px`);
    root.style.setProperty('--parallax-near-y', `${quality.layers['near-decoration'].y}px`);
    root.style.setProperty('--stars-opacity', `${quality.layers['distant-stars'].opacity}`);
    root.style.setProperty('--lines-opacity', `${quality.layers['constellation-lines'].opacity}`);
    root.style.setProperty('--near-opacity', `${quality.layers['near-decoration'].opacity}`);
    root.style.setProperty('--core-glow-strength', `${quality.coreGlowStrength}`);
  }, [quality]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // eslint-disable-next-line no-console
    console.log(
      `[StellaParallax] quality=${quality.tier} | pointer=${isMotionActive ? 'active' : 'inactive'} | layers=${Object.keys(layersById).length} | amplitude(px)=`,
      quality.layers,
    );
  }, [quality, isMotionActive, layersById]);

  const classes = ['stella-parallax-scene', fixed && 'stella-parallax-scene--fixed', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} ref={containerRef}>
      <ParallaxSceneProvider value={{ layersById, motionActive: isMotionActive, quality }}>
        {children}
      </ParallaxSceneProvider>
    </div>
  );
}
