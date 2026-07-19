import { createContext, useContext } from 'react';
import type { ParallaxLayerConfig } from './parallax.types';
import type { ParallaxQualitySettings } from './useParallaxQuality';

export interface ParallaxSceneContextValue {
  /** The scene's layer configs, keyed by id, as passed to <StellaParallax layers={...}>. */
  layersById: Record<string, ParallaxLayerConfig>;
  /** Responsive amplitude multiplier (desktop=1, tablet=0.6, mobile=0.35), already folded together with the quality tier's own multiplier. */
  amplitude: number;
  /** false under reduced/off motion mode — decorative groups (DecorationLayer, ForegroundLayer) hide themselves in that case, keeping only the static background per the reduced-motion brief. */
  motionActive: boolean;
  /** Element-count budget for the current device/tier — BackgroundLayer/DecorationLayer read this instead of hardcoding star/cluster counts. */
  quality: ParallaxQualitySettings;
}

const defaultQuality: ParallaxQualitySettings = {
  tier: 'high',
  starCount: 30,
  clusterCount: 3,
  showOrbitsAndGlow: true,
  amplitudeMultiplier: 1,
};

const defaultValue: ParallaxSceneContextValue = {
  layersById: {},
  amplitude: 1,
  motionActive: true,
  quality: defaultQuality,
};

const ParallaxSceneContext = createContext<ParallaxSceneContextValue>(defaultValue);

export const ParallaxSceneProvider = ParallaxSceneContext.Provider;

export function useParallaxScene(): ParallaxSceneContextValue {
  return useContext(ParallaxSceneContext);
}
