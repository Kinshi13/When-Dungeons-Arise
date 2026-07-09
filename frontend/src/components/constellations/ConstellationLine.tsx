interface ConstellationLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  className?: string;
}

export default function ConstellationLine({ x1, y1, x2, y2, className }: ConstellationLineProps) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={`constellation-line${className ? ` ${className}` : ""}`} />;
}
