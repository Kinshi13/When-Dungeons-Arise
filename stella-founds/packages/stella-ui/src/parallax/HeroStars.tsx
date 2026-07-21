import { useMemo, type CSSProperties } from 'react';
import { StellaParallaxLayer, useParallaxScene } from './engine';
import { useBreakpoint } from '../layout/useBreakpoint';
import './HeroStars.css';

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

const random = mulberry32(7);
const allHeroStars = Array.from({ length: 8 }, (_, i) => ({
  left: random() * 90 + 5,
  top: random() * 80 + 5,
  size: 3 + random() * 2,
  breatheDelay: (i * 1.7) % 6,
  breatheDuration: 5 + random() * 3,
}));

const countByBreakpoint = { desktop: 8, tablet: 6, mobile: 4 } as const;

/**
 * The ONLY continuously-animated part of the Stella Atlas background —
 * per the Fase 6.8 philosophy, everything else (StellaSkyBackground) is a
 * static, unchanging scene. A handful of "important" stars (6–8 desktop,
 * 3–5 mobile) get a soft glow, a slow brightness breath, and whatever
 * cursor-follow parallax the ancestor StellaParallaxLayer already applies
 * — nothing here runs its own timer or touches React state per frame.
 */
export function HeroStars() {
  const { layersById, quality } = useParallaxScene();
  const breakpoint = useBreakpoint();
  const stars = useMemo(() => allHeroStars.slice(0, countByBreakpoint[breakpoint]), [breakpoint]);

  return (
    <StellaParallaxLayer
      config={layersById['distant-stars'] ?? { id: 'distant-stars', depthX: 1, depthY: 1, maxOffsetX: 0, maxOffsetY: 0 }}
      className="hero-stars"
    >
      {stars.map((star, i) => (
        <span
          key={i}
          className={`hero-star${quality.tier === 'reduced' ? '' : ' is-breathing'}`}
          style={
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animationDuration: `${star.breatheDuration}s`,
              animationDelay: `${star.breatheDelay}s`,
            } as CSSProperties
          }
        />
      ))}
    </StellaParallaxLayer>
  );
}
