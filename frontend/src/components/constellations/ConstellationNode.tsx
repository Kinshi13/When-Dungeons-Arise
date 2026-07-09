interface ConstellationNodeProps {
  cx: number;
  cy: number;
  r: number;
  className?: string;
}

export default function ConstellationNode({ cx, cy, r, className }: ConstellationNodeProps) {
  return <circle cx={cx} cy={cy} r={r} className={`constellation-node${className ? ` ${className}` : ""}`} />;
}
