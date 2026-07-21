import { memo } from 'react';
import './StellaSkyBackground.css';

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

// Computed once at module load, not per-render — this is the "single
// Céu Stella" background: a static, deterministic scene, not a procedural
// system re-generated per mount. Web Fase 6.8 retires the old approach
// (dozens of individually-mounted <StellaStarParticle> DOM nodes) in favor
// of one static <svg> that never changes after first paint.
const random = mulberry32(42);

const smallStars = Array.from({ length: 55 }, () => ({
  cx: random() * 1600,
  cy: random() * 900,
  r: 0.6 + random() * 1,
  opacity: 0.25 + random() * 0.35,
}));

const goldStars = Array.from({ length: 6 }, () => ({
  cx: random() * 1600,
  cy: random() * 900,
  r: 1.1 + random() * 0.6,
}));

interface ConstellationCluster {
  points: [number, number][];
}

function generateClusters(count: number): ConstellationCluster[] {
  return Array.from({ length: count }, () => {
    const originX = random() * 1400 + 100;
    const originY = random() * 700 + 100;
    const points: [number, number][] = [[originX, originY]];
    for (let i = 1; i < 3; i += 1) {
      const prev = points[i - 1];
      points.push([prev[0] + (random() - 0.5) * 160, prev[1] + (random() - 0.5) * 160]);
    }
    return { points };
  });
}

const clusters = generateClusters(3);

/**
 * The single global "Céu Stella" — one static SVG covering the whole
 * viewport: base gradient, a couple of soft nebulae, a scattering of tiny
 * stars, a handful of gold ones, faint orbital arcs and constellation
 * lines. Nothing here animates; it exists purely as atmosphere and stays
 * mounted for the app's whole lifetime. The only things that move live in
 * HeroStars, layered on top of this.
 */
export const StellaSkyBackground = memo(function StellaSkyBackground() {
  return (
    <svg
      className="stella-sky-background"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="stella-sky-base" cx="30%" cy="8%" r="85%">
          <stop offset="0%" stopColor="#1c2440" />
          <stop offset="100%" stopColor="#0e1228" />
        </radialGradient>
        <radialGradient id="stella-sky-nebula-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(109, 139, 255, 0.14)" />
          <stop offset="100%" stopColor="rgba(109, 139, 255, 0)" />
        </radialGradient>
        <radialGradient id="stella-sky-nebula-gold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(232, 201, 136, 0.08)" />
          <stop offset="100%" stopColor="rgba(232, 201, 136, 0)" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#stella-sky-base)" />
      <ellipse cx="260" cy="140" rx="520" ry="340" fill="url(#stella-sky-nebula-blue)" />
      <ellipse cx="1340" cy="640" rx="440" ry="320" fill="url(#stella-sky-nebula-gold)" />

      {/* Faint orbital arcs — large circles, only the stroke visible. */}
      <circle cx="180" cy="620" r="420" fill="none" stroke="var(--accent-lavender)" strokeWidth="1" opacity="0.06" />
      <circle cx="1450" cy="180" r="300" fill="none" stroke="var(--accent-gold)" strokeWidth="1" opacity="0.05" />

      {clusters.map((cluster, i) => (
        <g key={i} opacity="0.22">
          <path
            d={cluster.points.map(([x, y], j) => `${j === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')}
            stroke="var(--accent-gold)"
            strokeWidth="1"
            fill="none"
          />
          {cluster.points.map(([x, y], j) => (
            <circle key={j} cx={x} cy={y} r={j === 0 ? 2 : 1.3} fill="var(--accent-gold)" />
          ))}
        </g>
      ))}

      {smallStars.map((star, i) => (
        <circle key={i} cx={star.cx} cy={star.cy} r={star.r} fill="var(--text-primary)" opacity={star.opacity} />
      ))}

      {goldStars.map((star, i) => (
        <circle key={i} cx={star.cx} cy={star.cy} r={star.r} fill="var(--accent-gold)" opacity="0.55" />
      ))}
    </svg>
  );
});
