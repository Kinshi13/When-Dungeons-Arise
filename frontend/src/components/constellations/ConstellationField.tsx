import { useMemo, type CSSProperties } from "react";
import ConstellationNode from "./ConstellationNode";
import ConstellationLine from "./ConstellationLine";
import { densityFor, generateNodes, generateLinks } from "./constellationConfig";
import { useLayoutMode } from "../../useLayoutMode";
import "./constellations.css";

interface ConstellationFieldProps {
  seed?: number;
  className?: string;
  style?: CSSProperties;
}

// Campo decorativo de constelações — puramente visual (aria-hidden,
// pointer-events:none via CSS), nunca deve concorrer com o starfield do
// Phaser na Recepção: este componente é usado como acento de UI-chrome
// (Stella Core, cards, divisores), não como um segundo fundo de céu.
export default function ConstellationField({ seed = 1, className, style }: ConstellationFieldProps) {
  const layoutMode = useLayoutMode();
  const density = densityFor(layoutMode);
  const nodes = useMemo(() => generateNodes(density.nodeCount, seed), [density.nodeCount, seed]);
  const links = useMemo(() => generateLinks(nodes, density.linkDistanceRatio), [nodes, density.linkDistanceRatio]);

  return (
    <svg
      className={`constellation-field${className ? ` ${className}` : ""}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={style}
      aria-hidden="true"
    >
      {links.map(([a, b]) => (
        <ConstellationLine key={`${a}-${b}`} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
      ))}
      {nodes.map((n, i) => (
        <ConstellationNode key={i} cx={n.x} cy={n.y} r={n.r} />
      ))}
    </svg>
  );
}
