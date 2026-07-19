import { useEffect, useMemo, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useBreakpoint } from '../../layout/useBreakpoint';

export type ParallaxQualityTier = 'high' | 'medium' | 'low' | 'reduced';

export interface ParallaxLayerAmplitude {
  x: number;
  y: number;
  opacity: number;
}

export interface ParallaxQualitySettings {
  tier: ParallaxQualityTier;
  /** Distant-star count for BackgroundLayer. */
  starCount: number;
  /** Constellation cluster count for DecorationLayer. */
  clusterCount: number;
  /** Whether DecorationLayer's orbit rings + soft glow render at all — the cheapest thing to drop entirely on LOW. */
  showOrbitsAndGlow: boolean;
  /** Per-layer travel (px) and opacity, keyed by the stellaParallaxScene layer id. */
  layers: Record<'distant-stars' | 'constellation-lines' | 'near-decoration', ParallaxLayerAmplitude>;
  /** 0–1, scales Stella Core's idle glow — not a shadow color, just an intensity multiplier other CSS reads via --core-glow-strength. */
  coreGlowStrength: number;
}

// Amplitude/opacity mid-points from the Web Fase 6.6 brief's ranges — HIGH
// sits at the top of "claramente perceptível", MEDIUM/LOW scale down from
// there. REDUCED keeps MEDIUM's static density (visible, just motionless —
// prefers-reduced-motion means no movement, not no scene).
const settingsByTier: Record<ParallaxQualityTier, ParallaxQualitySettings> = {
  high: {
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
  },
  medium: {
    tier: 'medium',
    starCount: 22,
    clusterCount: 2,
    showOrbitsAndGlow: true,
    layers: {
      'distant-stars': { x: 2.5, y: 2.5, opacity: 0.46 },
      'constellation-lines': { x: 6, y: 6, opacity: 0.27 },
      'near-decoration': { x: 9, y: 9, opacity: 0.25 },
    },
    coreGlowStrength: 0.85,
  },
  low: {
    tier: 'low',
    starCount: 12,
    clusterCount: 1,
    showOrbitsAndGlow: false,
    layers: {
      'distant-stars': { x: 1, y: 1, opacity: 0.35 },
      'constellation-lines': { x: 2.5, y: 2.5, opacity: 0.21 },
      'near-decoration': { x: 4, y: 4, opacity: 0.2 },
    },
    coreGlowStrength: 0.6,
  },
  reduced: {
    tier: 'reduced',
    // Same visual density as MEDIUM — reduced motion means frozen, not gone.
    starCount: 22,
    clusterCount: 2,
    showOrbitsAndGlow: true,
    layers: {
      'distant-stars': { x: 0, y: 0, opacity: 0.46 },
      'constellation-lines': { x: 0, y: 0, opacity: 0.27 },
      'near-decoration': { x: 0, y: 0, opacity: 0.25 },
    },
    coreGlowStrength: 0.6,
  },
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

/** `?parallax=high|medium|low|reduced` — manual override for testing/diagnosis, works in any environment (not gated to dev) so it's usable against a deployed Preview too. Read once; the URL doesn't change without a navigation. */
function readQualityOverride(): ParallaxQualityTier | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('parallax');
  if (value === 'high' || value === 'medium' || value === 'low' || value === 'reduced') return value;
  return null;
}

const qualityOverride = readQualityOverride();

/**
 * One-time ~400ms rAF probe measuring actual frame rate on this device —
 * catches devices that report capable-looking hardware (deviceMemory,
 * hardwareConcurrency) but are still under load or throttled. Runs once
 * per app session (module-level cache), not once per StellaParallax
 * instance, so mounting more than one scene never re-probes. A single low
 * reading only ever suggests starting cautiously — see the continuous
 * monitor below for the real "sustained slowness" signal.
 *
 * Deliberately waits for requestIdleCallback (falling back to a short
 * timeout on Safari, which doesn't implement it) before sampling — probing
 * immediately on mount means competing with the rest of the app's own
 * startup work (IndexedDB opening, fonts, initial render), which reliably
 * produces a false "slow" reading that has nothing to do with the device's
 * real capability. This was a real, confirmed bug: a capable desktop was
 * landing on LOW instead of HIGH because of exactly this timing.
 */
let cachedInitialFpsIsSlow: boolean | null = null;
let initialProbePromise: Promise<boolean> | null = null;

function whenIdle(callback: () => void) {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback;
  // Idle-callback firing only means "nothing queued right now" — startup
  // work (font swap, hydration, IndexedDB) can still resume immediately
  // after, so add a flat settle delay on top before actually sampling.
  const settleDelayMs = 700;
  if (ric) {
    ric(() => window.setTimeout(callback, settleDelayMs), { timeout: 1200 });
  } else {
    window.setTimeout(callback, 500 + settleDelayMs);
  }
}

function probeInitialFps(): Promise<boolean> {
  if (cachedInitialFpsIsSlow !== null) return Promise.resolve(cachedInitialFpsIsSlow);
  if (initialProbePromise) return initialProbePromise;

  initialProbePromise = new Promise((resolve) => {
    whenIdle(() => {
      let frames = 0;
      let raf: number;
      const start = performance.now();
      function tick(now: number) {
        frames += 1;
        if (now - start < 500) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const fps = (frames / (now - start)) * 1000;
        // Deliberately conservative — this only feeds a single-step
        // downgrade (see useParallaxQuality below), never a direct jump to
        // LOW, so an overly cautious reading costs one tier, not three. The
        // bar itself is set low (half of 48fps) because this single early
        // sample is inherently noisy — devtools/automation overhead,
        // background-tab throttling, or a coincidental GC pause can all
        // dip it without reflecting the device's real capability. The
        // continuous hysteresis-protected monitor is what actually proves
        // sustained slowness; this is just "don't start overconfident."
        cachedInitialFpsIsSlow = fps < 24;
        resolve(cachedInitialFpsIsSlow);
      }
      raf = requestAnimationFrame(tick);
      window.setTimeout(() => {
        if (cachedInitialFpsIsSlow === null) {
          cancelAnimationFrame(raf);
          cachedInitialFpsIsSlow = false;
          resolve(false);
        }
      }, 1500);
    });
  });

  return initialProbePromise;
}

const FPS_WINDOW_MS = 2000;
const FPS_SLOW_THRESHOLD = 40;
const FPS_SAMPLES_FOR_HYSTERESIS = 3;
const FPS_SLOW_SAMPLES_TO_DOWNGRADE = 2;

/**
 * Continuous runtime FPS monitor with hysteresis — samples average FPS
 * every ~2s and only reports "sustained slowness" once at least 2 of the
 * last 3 windows come in under threshold. A single momentary dip (GC
 * pause, a heavy re-render) never flips the tier; it takes a real pattern.
 * Module-level singleton, same reasoning as the initial probe.
 */
type SustainedSlowListener = (isSustainedSlow: boolean) => void;
let sustainedSlowListeners: Set<SustainedSlowListener> | null = null;
let recentSamples: boolean[] = [];
let monitorFrame: number | null = null;

function startSustainedFpsMonitor() {
  if (sustainedSlowListeners) return;
  sustainedSlowListeners = new Set();
  recentSamples = [];

  let windowStart = performance.now();
  let frames = 0;

  function tick(now: number) {
    frames += 1;
    if (now - windowStart >= FPS_WINDOW_MS) {
      const fps = (frames / (now - windowStart)) * 1000;
      recentSamples.push(fps < FPS_SLOW_THRESHOLD);
      if (recentSamples.length > FPS_SAMPLES_FOR_HYSTERESIS) recentSamples.shift();

      const slowCount = recentSamples.filter(Boolean).length;
      const isSustainedSlow =
        recentSamples.length >= FPS_SAMPLES_FOR_HYSTERESIS && slowCount >= FPS_SLOW_SAMPLES_TO_DOWNGRADE;
      sustainedSlowListeners?.forEach((listener) => listener(isSustainedSlow));

      windowStart = now;
      frames = 0;
    }
    monitorFrame = requestAnimationFrame(tick);
  }

  monitorFrame = requestAnimationFrame(tick);
}

function stopSustainedFpsMonitor() {
  if (monitorFrame !== null) cancelAnimationFrame(monitorFrame);
  monitorFrame = null;
  sustainedSlowListeners = null;
  recentSamples = [];
}

function subscribeSustainedFps(listener: SustainedSlowListener): () => void {
  startSustainedFpsMonitor();
  sustainedSlowListeners!.add(listener);
  return () => {
    sustainedSlowListeners?.delete(listener);
    if (sustainedSlowListeners?.size === 0) stopSustainedFpsMonitor();
  };
}

/**
 * Picks a parallax quality tier from breakpoint width, device hints
 * (deviceMemory/hardwareConcurrency, where available) and FPS — never
 * from width alone, and never downgrading just because an API is
 * unsupported (missing deviceMemory means "unknown", not "weak").
 * prefers-reduced-motion always wins. `?parallax=` query override beats
 * everything, for manual testing.
 */
export function useParallaxQuality(): ParallaxQualitySettings {
  const reducedMotion = usePrefersReducedMotion();
  const breakpoint = useBreakpoint();
  const [initialFpsIsSlow, setInitialFpsIsSlow] = useState(cachedInitialFpsIsSlow ?? false);
  const [sustainedSlow, setSustainedSlow] = useState(false);

  useEffect(() => {
    if (reducedMotion || qualityOverride) return;
    let cancelled = false;
    probeInitialFps().then((isSlow) => {
      if (!cancelled) setInitialFpsIsSlow(isSlow);
    });
    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || qualityOverride) return;
    return subscribeSustainedFps(setSustainedSlow);
  }, [reducedMotion]);

  return useMemo(() => {
    if (qualityOverride) return settingsByTier[qualityOverride];
    if (reducedMotion) return settingsByTier.reduced;

    let tier = baseTierForBreakpoint(breakpoint);

    const nav = navigator as Navigator & { deviceMemory?: number };
    // Only concrete evidence of weak hardware downgrades — an unsupported
    // API (undefined) is "unknown", never treated as "weak".
    const knownLowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2;
    const knownLowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2;
    if (knownLowMemory || knownLowCores) tier = downgrade(tier);

    // The initial probe is deliberately soft: one step down, same as a
    // weak-hardware hint, never straight to LOW off a single (possibly
    // startup-noise) reading. Sustained slowness — the continuous,
    // hysteresis-protected monitor — is the only thing allowed to force LOW.
    if (initialFpsIsSlow) tier = downgrade(tier);
    if (sustainedSlow) tier = 'low';

    return settingsByTier[tier];
  }, [reducedMotion, breakpoint, initialFpsIsSlow, sustainedSlow]);
}
