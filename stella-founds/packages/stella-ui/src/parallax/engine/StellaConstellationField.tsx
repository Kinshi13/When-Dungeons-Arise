import { useMemo } from 'react';
import { StellaConstellationNode } from './StellaConstellationNode';

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ConstellationCluster {
  points: [number, number][];
}

function generateClusters(count: number, seed: number): ConstellationCluster[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const originX = random() * 90 + 5;
    const originY = random() * 90 + 5;
    const nodeCount = 2 + Math.floor(random() * 2); // 2–3 nodes per cluster: low density by design
    const points: [number, number][] = [[originX, originY]];
    for (let i = 1; i < nodeCount; i += 1) {
      const prev = points[i - 1];
      points.push([
        Math.max(0, Math.min(100, prev[0] + (random() - 0.5) * 18)),
        Math.max(0, Math.min(100, prev[1] + (random() - 0.5) * 18)),
      ]);
    }
    return { points };
  });
}

/**
 * Procedural constellation clusters — a handful of small connected node
 * groups, deterministic from `seed` so the scene never re-renders per
 * frame (motion comes entirely from the ancestor StellaParallaxLayer's
 * transform, not from recomputing this SVG).
 */
export function StellaConstellationField({
  clusterCount = 2,
  seed = 1,
  className = '',
}: {
  clusterCount?: number;
  seed?: number;
  className?: string;
}) {
  const clusters = useMemo(() => generateClusters(clusterCount, seed), [clusterCount, seed]);

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ width: '100%', height: '100%' }}
    >
      {clusters.map((cluster, clusterIndex) => (
        <g key={clusterIndex}>
          <path
            d={cluster.points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')}
            stroke="currentColor"
            strokeWidth="0.15"
            fill="none"
            opacity="0.5"
          />
          {cluster.points.map(([x, y], nodeIndex) => (
            <StellaConstellationNode key={nodeIndex} cx={x} cy={y} r={nodeIndex === 0 ? 0.6 : 0.4} />
          ))}
        </g>
      ))}
    </svg>
  );
}
