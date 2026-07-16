export * from './StellaParallaxBackground';
export * from './parallaxConfig';
export * from './starField';
export * from './useParallaxInput';
export * from './BackgroundLayer';
export * from './ForegroundLayer';
export * from './DecorationLayer';

// Stella Parallax Engine (Web Fase 2.5) — generic, reusable motor. Lives in
// ./engine to avoid colliding with the legacy StellaParallaxBackground
// pieces above (used only by Android, untouched this phase); its own
// useParallaxInput/useParallaxMotion hooks are re-exported here under a
// "Stella"-prefixed name since `useParallaxInput` is already taken above.
export {
  StellaParallax,
  StellaParallaxLayer,
  StellaConstellationField,
  StellaConstellationNode,
  StellaOrbitRing,
  StellaStarParticle,
  useParallaxScene,
  useParallaxInput as useStellaParallaxInput,
  useParallaxMotion as useStellaParallaxMotion,
} from './engine';
export type {
  ParallaxInputSource,
  ParallaxState,
  ParallaxLayerConfig as StellaParallaxLayerConfig,
  ParallaxMotionMode,
  StellaParallaxProps,
} from './engine';
export { stellaParallaxScene, parallaxAmplitudeByBreakpoint, parallaxMotion as stellaParallaxMotionTokens } from './engine';
