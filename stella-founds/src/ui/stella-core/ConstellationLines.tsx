import { useLayoutEffect, useRef, useState } from 'react';
import type { StellaActionLayout } from './stellaLayout';

export function ConstellationLines({
  layouts,
  isActive,
  stagger,
  duration,
  reducedMotion,
}: {
  layouts: StellaActionLayout[];
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
      {layouts.map((layout, index) => {
        const length = lengths[index] ?? 0;
        const delay = isActive ? (layout.order - 1) * stagger : (maxOrder - layout.order) * stagger;
        // Slight perpendicular bow so the line reads as a drawn curve, not a ruler-straight spoke.
        const midX = layout.offsetX / 2 + layout.offsetY * 0.12;
        const midY = layout.offsetY / 2 - layout.offsetX * 0.12;

        if (reducedMotion) {
          return (
            <path
              key={index}
              d={`M0,0 Q${midX},${midY} ${layout.offsetX},${layout.offsetY}`}
              className="stella-core__line"
              style={{ opacity: isActive ? 0.4 : 0, transition: `opacity ${duration}s linear` }}
            />
          );
        }

        return (
          <g key={index}>
            <path
              ref={(el) => {
                pathRefs.current[index] = el;
              }}
              d={`M0,0 Q${midX},${midY} ${layout.offsetX},${layout.offsetY}`}
              className="stella-core__line"
              style={{
                strokeDasharray: length,
                strokeDashoffset: isActive ? 0 : length,
                transitionDelay: `${delay}s`,
                transitionDuration: `${duration}s`,
              }}
            />
            <circle
              cx={layout.offsetX}
              cy={layout.offsetY}
              r={2.2}
              className="stella-core__node"
              style={{
                opacity: isActive ? 0.8 : 0,
                transitionDelay: `${delay + duration * 0.5}s`,
                transitionDuration: `${duration}s`,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
