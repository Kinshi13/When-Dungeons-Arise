import { useMemo, useRef, type CSSProperties } from 'react';
import { parallaxLayers } from './parallaxConfig';
import { generateStarField } from './starField';
import { useParallaxInput } from './useParallaxInput';
import './StellaParallaxBackground.css';

const distantStars = generateStarField(50, 1);
const particles = generateStarField(14, 7);

function layerStyle(id: string): CSSProperties {
  const layer = parallaxLayers.find((entry) => entry.id === id);
  return { '--layer-offset': `${layer?.offsetPx ?? 0}px` } as CSSProperties;
}

export function StellaParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  useParallaxInput(containerRef);

  const stars = useMemo(() => distantStars, []);
  const dust = useMemo(() => particles, []);

  return (
    <div className="stella-parallax" ref={containerRef} aria-hidden="true">
      <div className="stella-parallax__layer stella-parallax__sky" style={layerStyle('sky-gradient')} />

      <div className="stella-parallax__layer stella-parallax__stars" style={layerStyle('distant-stars')}>
        {stars.map((star, index) => (
          <span
            key={index}
            className="stella-parallax__star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      <svg
        className="stella-parallax__layer stella-parallax__constellation"
        style={layerStyle('constellation-lines')}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <path d="M8 20 L22 28 L18 42" stroke="currentColor" strokeWidth="0.15" fill="none" />
        <circle cx="8" cy="20" r="0.5" fill="currentColor" />
        <circle cx="22" cy="28" r="0.6" fill="currentColor" />
        <circle cx="18" cy="42" r="0.4" fill="currentColor" />

        <path d="M78 12 L88 22 L94 16" stroke="currentColor" strokeWidth="0.15" fill="none" />
        <circle cx="78" cy="12" r="0.5" fill="currentColor" />
        <circle cx="88" cy="22" r="0.4" fill="currentColor" />
        <circle cx="94" cy="16" r="0.5" fill="currentColor" />
      </svg>

      <div className="stella-parallax__layer stella-parallax__orbits" style={layerStyle('soft-orbits')}>
        <span className="stella-parallax__orbit stella-parallax__orbit--a" />
        <span className="stella-parallax__orbit stella-parallax__orbit--b" />
      </div>

      <div className="stella-parallax__layer stella-parallax__glow" style={layerStyle('foreground-glow')} />

      <div className="stella-parallax__layer stella-parallax__particles" style={layerStyle('subtle-particles')}>
        {dust.map((particle, index) => (
          <span
            key={index}
            className="stella-parallax__particle"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size * 0.8,
              height: particle.size * 0.8,
              opacity: particle.opacity * 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}
