import type { SVGProps } from "react";
import "./constellations.css";

// Estrela pequena/monocromática (glifo de 4 pontas, mesma família do
// StellaStarIcon) usada como acento discreto — status star nos cards, nós
// de conexão no Stella Core. Sem gradiente: `fill: currentColor` via CSS
// pra herdar a cor do contexto (dourado por padrão).
export default function StellaSpark(props: SVGProps<SVGSVGElement>) {
  const { className, ...rest } = props;
  return (
    <svg viewBox="0 0 24 24" className={`stella-spark${className ? ` ${className}` : ""}`} aria-hidden="true" {...rest}>
      <path d="M12 4c0 3.5 1.8 5.5 6 8-4.2 2.5-6 4.5-6 8 0-3.5-1.8-5.5-6-8 4.2-2.5 6-4.5 6-8Z" />
    </svg>
  );
}
