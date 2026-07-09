import type { CSSProperties } from "react";
import "./constellations.css";

interface OrbitRingProps {
  className?: string;
  style?: CSSProperties;
}

// Anel orbital discreto (usado no Stella Core ao abrir) — apenas um traço
// fino, sem preenchimento; profundidade sutil, não um efeito de destaque.
export default function OrbitRing({ className, style }: OrbitRingProps) {
  return (
    <svg
      className={`orbit-ring${className ? ` ${className}` : ""}`}
      viewBox="0 0 100 100"
      style={style}
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" />
    </svg>
  );
}
