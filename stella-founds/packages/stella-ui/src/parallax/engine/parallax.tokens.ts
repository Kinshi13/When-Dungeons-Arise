import type { ParallaxLayerConfig } from './parallax.types';

/**
 * Default six-layer Stella scene, back to front. Depth (maxOffset) and
 * scale grow together so deeper layers stay visually anchored while
 * nearer ones read a little more mobile — kept subtle per the "elegant,
 * not exaggerated" brief.
 */
/**
 * Three-layer Stella scene, back to front (Web Fase 6.5 consolidated this
 * from six wrapper divs down to three — same visual composition approved
 * in Fase 5, just fewer independently-transformed elements: the gradient
 * backdrop now shares distant-stars' layer, and orbital rings + soft glow
 * share one "near decoration" layer instead of two).
 */
export const stellaParallaxScene: ParallaxLayerConfig[] = [
  { id: 'distant-stars', depthX: 1, depthY: 0.6, maxOffsetX: 3, maxOffsetY: 3, scale: 1.01, zIndex: 1, enabled: true },
  { id: 'constellation-lines', depthX: 1, depthY: 0.6, maxOffsetX: 5, maxOffsetY: 5, scale: 1.015, zIndex: 2, enabled: true },
  { id: 'near-decoration', depthX: 1, depthY: 0.6, maxOffsetX: 8, maxOffsetY: 8, scale: 1.02, zIndex: 3, enabled: true },
];

/** Amplitude multiplier by Stella shell breakpoint — same layer config everywhere, just less travel on smaller screens. */
export const parallaxAmplitudeByBreakpoint = {
  desktop: 1,
  tablet: 0.6,
  mobile: 0.35,
} as const;

/** Motion pipeline constants: dead zone (ignore tiny input jitter near center) and smoothing (lerp factor toward the target each frame). */
export const parallaxMotion = {
  deadZone: 0.02,
  smoothing: 0.08,
  idleReturnSmoothing: 0.05,
} as const;
