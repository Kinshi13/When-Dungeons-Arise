import type { SVGProps } from "react";

// Estrela de 4 pontas (glifo ✦) — ícone do Stella Core. Traço suave/gradiente,
// deliberadamente diferente da linguagem pixel art dos ícones da dock atual
// (icons2.tsx): o Core é o elemento novo da identidade Stella, não parte do
// visual "Guilda" que ele convive ao lado.
export default function StellaStarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 2c0 5 2.5 7.5 8 10-5.5 2.5-8 5-8 10 0-5-2.5-7.5-8-10 5.5-2.5 8-5 8-10Z"
        fill="url(#stella-core-star-gradient)"
      />
      <defs>
        <linearGradient id="stella-core-star-gradient" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--stella-blue-soft)" />
          <stop offset="100%" stopColor="var(--stella-gold)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
