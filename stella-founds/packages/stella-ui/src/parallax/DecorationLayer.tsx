import { StellaParallaxLayer, useParallaxScene, StellaConstellationField, StellaOrbitRing } from './engine';

/**
 * Mid-scene decoration: constellation lines, orbital rings, soft glow.
 * Hides entirely under reduced/off motion (only BackgroundLayer persists
 * in that case, per the reduced-motion brief) rather than rendering
 * motionless — keeps the reduced-motion view calm instead of just frozen.
 */
export type DecorationLayerProps = Record<string, never>;

export function DecorationLayer(_props: DecorationLayerProps) {
  const { layersById, motionActive } = useParallaxScene();
  if (!motionActive) return null;

  return (
    <>
      <StellaParallaxLayer
        config={layersById['constellation-lines'] ?? { id: 'constellation-lines', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
        className="stella-scene-constellation"
      >
        <StellaConstellationField clusterCount={2} seed={3} />
      </StellaParallaxLayer>

      <StellaParallaxLayer
        config={layersById['orbital-rings'] ?? { id: 'orbital-rings', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
        className="stella-scene-orbits"
      >
        <StellaOrbitRing size="60vmax" left="-20vmax" top="50vh" opacity={0.12} />
        <StellaOrbitRing size="40vmax" right="-14vmax" top="-10vh" opacity={0.12} />
      </StellaParallaxLayer>

      <StellaParallaxLayer
        config={layersById['soft-glow'] ?? { id: 'soft-glow', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
        className="stella-scene-glow"
      />
    </>
  );
}
