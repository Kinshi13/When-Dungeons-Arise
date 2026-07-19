import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useBreakpoint } from '../../layout/useBreakpoint';

export type ParallaxQualityTier = 'high' | 'medium' | 'low' | 'reduced';

export interface ParallaxQualitySettings {
  tier: ParallaxQualityTier;
  /** Distant-star count for BackgroundLayer. */
  starCount: number;
  /** Constellation cluster count for DecorationLayer. */
  clusterCount: number;
  /** Whether DecorationLayer's orbit rings + soft glow render at all — the cheapest thing to drop entirely on LOW. */
  showOrbitsAndGlow: boolean;
  /** Multiplies the breakpoint amplitude — smaller travel on weaker tiers. */
  amplitudeMultiplier: number;
}

const settingsByTier: Record<ParallaxQualityTier, ParallaxQualitySettings> = {
  high: { tier: 'high', starCount: 30, clusterCount: 3, showOrbitsAndGlow: true, amplitudeMultiplier: 1 },
  medium: { tier: 'medium', starCount: 20, clusterCount: 2, showOrbitsAndGlow: true, amplitudeMultiplier: 0.8 },
  low: { tier: 'low', starCount: 10, clusterCount: 1, showOrbitsAndGlow: false, amplitudeMultiplier: 0.5 },
  reduced: { tier: 'reduced', starCount: 10, clusterCount: 0, showOrbitsAndGlow: false, amplitudeMultiplier: 0 },
};

function baseTierForBreakpoint(breakpoint: 'mobile' | 'tablet' | 'desktop'): 'high' | 'medium' | 'low' {
  if (breakpoint === 'mobile') return 'low';
  if (breakpoint === 'tablet') return 'medium';
  return 'high';
}

function downgrade(tier: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
  if (tier === 'high') return 'medium';
  return 'low';
}

/**
 * One-time ~400ms rAF probe measuring actual frame rate on this device —
 * catches devices that report capable-looking hardware (deviceMemory,
 * hardwareConcurrency) but are still under load or throttled. Runs once
 * per app session (module-level cache), not once per StellaParallax
 * instance, so mounting more than one scene never re-probes.
 */
let cachedFpsIsSlow: boolean | null = null;
let probePromise: Promise<boolean> | null = null;

function probeFps(): Promise<boolean> {
  if (cachedFpsIsSlow !== null) return Promise.resolve(cachedFpsIsSlow);
  if (probePromise) return probePromise;

  probePromise = new Promise((resolve) => {
    let frames = 0;
    let raf: number;
    const start = performance.now();
    function tick(now: number) {
      frames += 1;
      if (now - start < 400) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const fps = (frames / (now - start)) * 1000;
      cachedFpsIsSlow = fps < 45;
      resolve(cachedFpsIsSlow);
    }
    raf = requestAnimationFrame(tick);
    // Safety net: if rAF never fires enough times (e.g. backgrounded tab), don't hang forever.
    window.setTimeout(() => {
      if (cachedFpsIsSlow === null) {
        cancelAnimationFrame(raf);
        cachedFpsIsSlow = false;
        resolve(false);
      }
    }, 1000);
  });

  return probePromise;
}

/**
 * Picks a parallax quality tier from breakpoint width, device hints
 * (deviceMemory/hardwareConcurrency, where available) and a one-time FPS
 * probe — never from width alone. prefers-reduced-motion always wins.
 */
export function useParallaxQuality(): ParallaxQualitySettings {
  const reducedMotion = usePrefersReducedMotion();
  const breakpoint = useBreakpoint();
  const [fpsIsSlow, setFpsIsSlow] = useState(cachedFpsIsSlow ?? false);

  useEffect(() => {
    if (reducedMotion) return;
    let cancelled = false;
    probeFps().then((isSlow) => {
      if (!cancelled) setFpsIsSlow(isSlow);
    });
    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  return useMemo(() => {
    if (reducedMotion) return settingsByTier.reduced;

    let tier = baseTierForBreakpoint(breakpoint);

    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
    const lowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    if (lowMemory || lowCores) tier = downgrade(tier);

    if (fpsIsSlow) tier = 'low';

    return settingsByTier[tier];
  }, [reducedMotion, breakpoint, fpsIsSlow]);
}
