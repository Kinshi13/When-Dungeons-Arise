import { createContext, useContext } from 'react';
import type { ParallaxLayerConfig } from './parallax.types';
import type { ParallaxQualitySettings } from './useParallaxQuality';

export interface ParallaxSceneContextValue {
  /** The scene's layer configs, keyed by id, as passed to <StellaParallax layers={...}>. */
  layersById: Record<string, ParallaxLayerConfig>;
  /** false under reduced/off motion mode — decorative groups (DecorationLayer, ForegroundLayer) hide themselves in that case, keeping only the static background per the reduced-motion brief. */
  motionActive: boolean;
  /** Element-count budget, per-layer amplitude/opacity and glow strength for the current device/tier — BackgroundLayer/DecorationLayer/StellaParallaxLayer read this instead of hardcoding numbers. */
  quality: ParallaxQualitySettings;
}

const defaultQuality: ParallaxQualitySettings = {
  tier: 'high',
  starCount: 30,
  clusterCount: 3,
  showOrbitsAndGlow: true,
  layers: {
    'distant-stars': { x: 4, y: 4, opacity: 0.55 },
    'constellation-lines': { x: 8.5, y: 8.5, opacity: 0.32 },
    'near-decoration': { x: 14, y: 14, opacity: 0.3 },
  },
  coreGlowStrength: 1,
};

const defaultValue: ParallaxSceneContextValue = {
  layersById: {},
  motionActive: true,
  quality: defaultQuality,
};

const ParallaxSceneContext = createContext<ParallaxSceneContextValue>(defaultValue);

export const ParallaxSceneProvider = ParallaxSceneContext.Provider;

export function useParallaxScene(): ParallaxSceneContextValue {
  return useContext(ParallaxSceneContext);
}
