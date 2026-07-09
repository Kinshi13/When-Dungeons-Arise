import type { CSSProperties } from "react";
import "./constellations.css";

interface AstralDividerProps {
  className?: string;
  style?: CSSProperties;
}

// Divisor decorativo — linha fina com um losango no meio, alternativa ao
// <hr> genérico para separar seções dentro da identidade Stella Founds.
export default function AstralDivider({ className, style }: AstralDividerProps) {
  return (
    <svg
      className={`astral-divider${className ? ` ${className}` : ""}`}
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      style={style}
      aria-hidden="true"
    >
      <line x1="0" y1="3" x2="42" y2="3" />
      <path d="M50 0 L53 3 L50 6 L47 3 Z" />
      <line x1="58" y1="3" x2="100" y2="3" />
    </svg>
  );
}
