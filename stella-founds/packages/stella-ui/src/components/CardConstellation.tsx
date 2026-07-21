import { useEffect, useRef, useState, type PointerEvent } from 'react';
import './CardConstellation.css';

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

/** Biases a coordinate toward one edge of the 0–100 box — keeps the whole
 * pattern framing the card's periphery/corners instead of drifting over
 * its center, where a card's real content (label/value text) usually
 * sits. This is what actually keeps "nunca chamar mais atenção que o
 * conteúdo" true, more than opacity alone would. */
function edgeBiased(random: () => number): number {
  return random() < 0.5 ? random() * 22 : 78 + random() * 22;
}

function generatePattern(seed: number): [number, number][] {
  const random = mulberry32(seed);
  const nodeCount = 4 + Math.floor(random() * 2); // 4–5 stars, per the brief
  let x = edgeBiased(random);
  let y = edgeBiased(random);
  const points: [number, number][] = [[x, y]];
  for (let i = 1; i < nodeCount; i += 1) {
    x = Math.max(2, Math.min(98, x + (random() - 0.5) * 40));
    y = Math.max(2, Math.min(98, y + (random() - 0.5) * 40));
    points.push([x, y]);
  }
  return points;
}

// 12 distinct static patterns — computed once at module load, shared by
// every CardConstellation instance (never regenerated per card/render).
const PATTERN_COUNT = 12;
const patterns = Array.from({ length: PATTERN_COUNT }, (_, i) => generatePattern(101 + i));

const TOUCH_LIT_MS = 2000;

/** Deterministic string → small positive int, for picking a stable CardConstellation `variant` from e.g. a card's label or entry id. */
export function constellationSeedFromString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Named pattern indices — one signature per area of the app, chosen once
 * and fixed (not re-hashed from a label), so "Financeiro" always reads as
 * the same shape everywhere it appears, the same way a category gets one
 * color, not a different one per screen. Web Fase 6.9 section 3.
 */
export const constellationSignature = {
  financeiro: 0,
  calendario: 1,
  assinaturas: 2,
  relatorios: 3,
  resumo: 4,
  configuracoes: 5,
} as const;

/**
 * A tiny, near-invisible constellation overlay for a card — 4–5 stars
 * connected by faint lines, one of 8 fixed patterns picked by `variant`
 * (e.g. an index derived from the card's id, so the same card always gets
 * the same pattern). Lights up on desktop hover, stays lit while
 * `selected`, and on mobile briefly lights up ~2s after a touch before
 * fading back — all via CSS transitions on opacity/stroke, nothing
 * animates continuously and nothing here ever outshines the card's own
 * content.
 *
 * Nodes are separate absolutely-positioned circular <span>s, not SVG
 * <circle>s sharing the line's viewBox — a viewBox stretched to fill a
 * card's actual (non-square) aspect ratio turns true circles into visibly
 * squashed ellipses. The connecting line stays in the SVG since a
 * slightly-stretched line reads fine; a stretched "star" reads as a smudge.
 */
export function CardConstellation({
  variant = 0,
  selected = false,
}: {
  /** Picks one of 8 fixed patterns — pass a stable per-card value (e.g. an index) so the same card keeps the same shape. */
  variant?: number;
  /** Keeps the constellation lit, e.g. because the card is the current selection. */
  selected?: boolean;
}) {
  const points = patterns[((variant % PATTERN_COUNT) + PATTERN_COUNT) % PATTERN_COUNT];
  const [touchLit, setTouchLit] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch') return;
    setTouchLit(true);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setTouchLit(false), TOUCH_LIT_MS);
  }

  const classes = ['card-constellation', selected && 'is-selected', touchLit && 'is-touched']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} aria-hidden="true" onPointerDown={handlePointerDown}>
      <svg className="card-constellation__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ')}
          className="card-constellation__line"
          fill="none"
        />
      </svg>
      {points.map(([x, y], i) => (
        <span
          key={i}
          className="card-constellation__node"
          style={{ left: `${x}%`, top: `${y}%`, width: i === 0 ? 4.4 : 2.8, height: i === 0 ? 4.4 : 2.8 }}
        />
      ))}
    </div>
  );
}
