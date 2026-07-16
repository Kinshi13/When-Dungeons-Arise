import { duration, easing } from '../tokens/motion';

type Keyframe = Record<string, string | number>;

function toCubicBezier(curve: readonly [number, number, number, number]) {
  return `cubic-bezier(${curve.join(', ')})`;
}

export interface StellaAnimateOptions {
  durationS?: number;
  easingCurve?: readonly [number, number, number, number];
  fill?: FillMode;
}

function animate(element: Element, keyframes: Keyframe[], options: StellaAnimateOptions = {}) {
  const { durationS = duration.normal, easingCurve = easing.standard, fill = 'forwards' } = options;
  return element.animate(keyframes, {
    duration: durationS * 1000,
    easing: toCubicBezier(easingCurve),
    fill,
  });
}

/** Fade an element in/out using the Web Animations API and Stella's shared duration/easing tokens. */
export function fade(element: Element, direction: 'in' | 'out', options?: StellaAnimateOptions) {
  const keyframes: Keyframe[] =
    direction === 'in' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
  return animate(element, keyframes, options);
}

/** Scale an element in/out around its center. */
export function scale(element: Element, direction: 'in' | 'out', options?: StellaAnimateOptions) {
  const keyframes: Keyframe[] =
    direction === 'in'
      ? [{ transform: 'scale(0.85)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }]
      : [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.85)', opacity: 0 }];
  return animate(element, keyframes, options);
}

/** Slide an element in/out along one axis. */
export function slide(
  element: Element,
  direction: 'in' | 'out',
  axis: 'x' | 'y' = 'y',
  distancePx = 16,
  options?: StellaAnimateOptions,
) {
  const offset = axis === 'x' ? `translateX(${distancePx}px)` : `translateY(${distancePx}px)`;
  const keyframes: Keyframe[] =
    direction === 'in'
      ? [{ transform: offset, opacity: 0 }, { transform: 'translate(0, 0)', opacity: 1 }]
      : [{ transform: 'translate(0, 0)', opacity: 1 }, { transform: offset, opacity: 0 }];
  return animate(element, keyframes, options);
}

/** Draw (or erase) an SVG path's stroke via stroke-dashoffset, mirroring the technique used by the Stella Core constellation lines. */
export function constellationDraw(path: SVGPathElement, direction: 'draw' | 'erase', options?: StellaAnimateOptions) {
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length}`;
  const keyframes: Keyframe[] =
    direction === 'draw'
      ? [{ strokeDashoffset: length }, { strokeDashoffset: 0 }]
      : [{ strokeDashoffset: 0 }, { strokeDashoffset: length }];
  return animate(path, keyframes, options);
}
