import { createContext, useContext } from 'react';
import type { ParallaxLayerConfig } from './parallax.types';

export interface ParallaxSceneContextValue {
  /** The scene's layer configs, keyed by id, as passed to <StellaParallax layers={...}>. */
  layersById: Record<string, ParallaxLayerConfig>;
  /** Responsive amplitude multiplier (desktop=1, tablet=0.6, mobile=0.35). */
  amplitude: number;
  /** false under reduced/off motion mode — decorative groups (DecorationLayer, ForegroundLayer) hide themselves in that case, keeping only the static background per the reduced-motion brief. */
  motionActive: boolean;
}

const defaultValue: ParallaxSceneContextValue = { layersById: {}, amplitude: 1, motionActive: true };

const ParallaxSceneContext = createContext<ParallaxSceneContextValue>(defaultValue);

export const ParallaxSceneProvider = ParallaxSceneContext.Provider;

export function useParallaxScene(): ParallaxSceneContextValue {
  return useContext(ParallaxSceneContext);
}
