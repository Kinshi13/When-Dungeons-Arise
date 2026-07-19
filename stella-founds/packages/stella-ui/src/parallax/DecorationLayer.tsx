import { StellaParallaxLayer, useParallaxScene, StellaConstellationField, StellaOrbitRing } from './engine';

/**
 * Mid/near-scene decoration: constellation lines on their own layer, orbit
 * rings + soft glow sharing a second "near-decoration" layer (Web Fase 6.5
 * merged what used to be two separate layers — same visual result, one
 * fewer transformed wrapper). Hides entirely under reduced/off motion
 * (only BackgroundLayer persists in that case) rather than rendering
 * motionless — keeps the reduced-motion view calm instead of just frozen.
 * Cluster count and whether rings/glow render at all come from the
 * scene's quality tier — LOW drops rings+glow outright, the cheapest
 * thing to cut.
 */
export type DecorationLayerProps = Record<string, never>;

export function DecorationLayer(_props: DecorationLayerProps) {
  const { layersById, motionActive, quality } = useParallaxScene();
  if (!motionActive || quality.clusterCount === 0) return null;

  return (
    <>
      <StellaParallaxLayer
        config={layersById['constellation-lines'] ?? { id: 'constellation-lines', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
        className="stella-scene-constellation"
      >
        <StellaConstellationField clusterCount={quality.clusterCount} seed={3} />
      </StellaParallaxLayer>

      {quality.showOrbitsAndGlow && (
        <StellaParallaxLayer
          config={layersById['near-decoration'] ?? { id: 'near-decoration', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
          className="stella-scene-orbits stella-scene-glow"
        >
          <StellaOrbitRing size="60vmax" left="-20vmax" top="50vh" opacity={0.12} />
          <StellaOrbitRing size="40vmax" right="-14vmax" top="-10vh" opacity={0.12} />
        </StellaParallaxLayer>
      )}
    </>
  );
}
