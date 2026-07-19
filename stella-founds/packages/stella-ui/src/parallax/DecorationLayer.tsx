import { StellaParallaxLayer, useParallaxScene, StellaConstellationField, StellaOrbitRing } from './engine';

/**
 * Mid/near-scene decoration: constellation lines on their own layer, orbit
 * rings + soft glow sharing a second "near-decoration" layer (Web Fase 6.5
 * merged what used to be two separate layers — same visual result, one
 * fewer transformed wrapper).
 *
 * Web Fase 6.6: this used to hide entirely under reduced/off motion — that
 * was wrong. prefers-reduced-motion means "no movement", not "no scene";
 * REDUCED tier keeps a real cluster/orbit count (see useParallaxQuality),
 * so this only actually disappears when a tier's clusterCount is
 * genuinely 0. `motionActive` no longer gates existence, only the CSS
 * ambient-drift animation below does (see stellaScene.css).
 */
export type DecorationLayerProps = Record<string, never>;

export function DecorationLayer(_props: DecorationLayerProps) {
  const { layersById, motionActive, quality } = useParallaxScene();
  if (quality.clusterCount === 0) return null;

  return (
    <>
      <StellaParallaxLayer
        config={layersById['constellation-lines'] ?? { id: 'constellation-lines', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
        className={`stella-scene-constellation${motionActive ? ' is-active' : ''}`}
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
