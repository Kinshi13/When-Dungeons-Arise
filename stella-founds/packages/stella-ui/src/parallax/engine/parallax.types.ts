import type { ReactNode } from 'react';

/**
 * Generic parallax engine contracts. Knows nothing about finance, routes,
 * or pages — only normalized 2D motion and layer depth.
 */
export type ParallaxInputSource = 'pointer' | 'touch' | 'device-orientation' | 'idle';

export interface ParallaxState {
  /** Normalized horizontal position, -1 (left edge) to +1 (right edge), 0 = center. */
  x: number;
  /** Normalized vertical position, -1 (top edge) to +1 (bottom edge), 0 = center. */
  y: number;
  source: ParallaxInputSource;
  active: boolean;
}

export interface ParallaxLayerConfig {
  id: string;
  /** Per-axis multiplier applied to the normalized input before scaling by maxOffset (lets a layer read wider on X than Y, e.g. desktop's "maior amplitude horizontal"). */
  depthX: number;
  depthY: number;
  /** Cap, in pixels, on how far this layer may translate on each axis. */
  maxOffsetX: number;
  maxOffsetY: number;
  scale?: number;
  rotate?: number;
  blur?: number;
  opacity?: number;
  zIndex?: number;
  enabled?: boolean;
}

export type ParallaxMotionMode = 'full' | 'reduced' | 'off';

export interface StellaParallaxProps {
  layers: ParallaxLayerConfig[];
  enabled?: boolean;
  /** Force reduced motion regardless of the OS preference. */
  reducedMotion?: boolean;
  /** Explicit override: 'full' (default, follows OS preference), 'reduced' (static layers, no listeners/RAF), 'off' (engine fully inert). */
  motionMode?: ParallaxMotionMode;
  className?: string;
  children?: ReactNode;
}
