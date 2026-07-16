import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { StellaConstellationLayout } from './stellaLayout';

function resolveAnchor(layouts: StellaConstellationLayout[], layout: StellaConstellationLayout) {
  if (layout.connectionFrom === 'core') return { x: 0, y: 0 };
  const parent = layouts[layout.connectionFrom];
  return { x: parent.normalizedX, y: parent.normalizedY };
}

export function ConstellationLines({
  layouts,
  isActive,
  stagger,
  duration,
  reducedMotion,
}: {
  layouts: StellaConstellationLayout[];
  isActive: boolean;
  stagger: number;
  duration: number;
  reducedMotion: boolean;
}) {
  const maxOrder = layouts.length;
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [lengths, setLengths] = useState<number[]>([]);

  useLayoutEffect(() => {
    setLengths(pathRefs.current.map((el) => el?.getTotalLength() ?? 0));
  }, [layouts]);

  return (
    <svg className="stella-core__lines" aria-hidden="true" overflow="visible">
      <defs>
        <linearGradient id="stella-line-gradient" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" style={{ stopColor: 'var(--accent-stella)', stopOpacity: 0.15 }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent-lavender)', stopOpacity: 0.65 }} />
        </linearGradient>
      </defs>
      {layouts.map((layout, index) => {
        const length = lengths[index] ?? 0;
        const delay = isActive
          ? (layout.animationOrder - 1) * stagger
          : (maxOrder - layout.animationOrder) * stagger;
        const anchor = resolveAnchor(layouts, layout);
        // Gentle organic bow, perpendicular to the segment, not a ruler-straight spoke.
        const dx = layout.normalizedX - anchor.x;
        const dy = layout.normalizedY - anchor.y;
        const midX = anchor.x + dx / 2 + dy * 0.12;
        const midY = anchor.y + dy / 2 - dx * 0.12;
        const path = `M${anchor.x},${anchor.y} Q${midX},${midY} ${layout.normalizedX},${layout.normalizedY}`;

        if (reducedMotion) {
          return (
            <path
              key={index}
              d={path}
              className="stella-core__line"
              vectorEffect="non-scaling-stroke"
              style={{ opacity: isActive ? 0.7 : 0, transition: `opacity ${duration}s linear` }}
            />
          );
        }

        const style = {
          '--line-length': length,
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
        } as CSSProperties;

        return (
          <g key={index}>
            <path
              ref={(el) => {
                pathRefs.current[index] = el;
              }}
              d={path}
              className={`stella-core__line${isActive ? ' is-active' : ' is-closing'}`}
              vectorEffect="non-scaling-stroke"
              style={style}
            />
            <circle
              cx={layout.normalizedX}
              cy={layout.normalizedY}
              r={0.045}
              className={`stella-core__node${isActive ? ' is-active' : ' is-closing'}`}
              style={{
                animationDelay: `${delay + duration * 0.5}s`,
                animationDuration: `${duration}s`,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
