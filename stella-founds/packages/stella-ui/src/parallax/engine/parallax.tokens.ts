import type { ParallaxLayerConfig } from './parallax.types';

/**
 * Default six-layer Stella scene, back to front. Depth (maxOffset) and
 * scale grow together so deeper layers stay visually anchored while
 * nearer ones read a little more mobile — kept subtle per the "elegant,
 * not exaggerated" brief.
 */
export const stellaParallaxScene: ParallaxLayerConfig[] = [
  { id: 'background-gradient', depthX: 1, depthY: 0.6, maxOffsetX: 1, maxOffsetY: 1, scale: 1.005, zIndex: 0, enabled: true },
  { id: 'distant-stars', depthX: 1, depthY: 0.6, maxOffsetX: 3, maxOffsetY: 3, scale: 1.01, zIndex: 1, enabled: true },
  { id: 'constellation-lines', depthX: 1, depthY: 0.6, maxOffsetX: 5, maxOffsetY: 5, scale: 1.015, zIndex: 2, enabled: true },
  { id: 'orbital-rings', depthX: 1, depthY: 0.6, maxOffsetX: 7, maxOffsetY: 7, scale: 1.02, zIndex: 3, enabled: true },
  { id: 'soft-glow', depthX: 1, depthY: 0.6, maxOffsetX: 9, maxOffsetY: 9, scale: 1.025, zIndex: 4, enabled: true },
  { id: 'foreground-particles', depthX: 1, depthY: 0.6, maxOffsetX: 12, maxOffsetY: 12, scale: 1.03, zIndex: 5, enabled: true },
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
