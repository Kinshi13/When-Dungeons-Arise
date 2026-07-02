import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  stroke: "var(--border)",
  strokeWidth: 1,
  strokeLinejoin: "miter",
  strokeLinecap: "square",
  shapeRendering: "crispEdges",
};

// Recepção da Guilda — emblema/brasão
export function TabGuildIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5 19 5v6c0 5-3 8.5-7 10.5C8 19.5 5 16 5 11V5Z" fill="var(--reuniao)" />
      <path d="M12 6.5 15 8v3.5c0 2.5-1.4 4.3-3 5.3-1.6-1-3-2.8-3-5.3V8Z" fill="var(--accent)" />
    </svg>
  );
}

// Lembretes — sino sólido com badge
export function TabBellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12 3.5c-3 0-5 2.2-5 5.2v2.6L5 14.5v1.2h14v-1.2l-2-3.2V8.7c0-3-2-5.2-5-5.2Z"
        fill="var(--accent)"
      />
      <rect x="10" y="17" width="4" height="2.2" fill="var(--accent)" />
      <circle cx="17.5" cy="5.5" r="2.6" fill="var(--danger)" />
    </svg>
  );
}

// Finanças — pilha de moedas
export function TabCoinsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <ellipse cx="12" cy="17.5" rx="7.5" ry="2.6" fill="var(--outro)" />
      <ellipse cx="12" cy="13.5" rx="7.5" ry="2.6" fill="var(--outro)" />
      <ellipse cx="12" cy="9.5" rx="7.5" ry="2.6" fill="var(--accent)" />
      <ellipse cx="12" cy="9.5" rx="4.6" ry="1.5" fill="none" stroke="var(--border)" strokeWidth="0.8" />
    </svg>
  );
}

// Calendário (home/central) — calendário com estrela
export function TabHomeCalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3.2" y="5" width="17.6" height="15" fill="var(--surface-raised)" />
      <rect x="3.2" y="5" width="17.6" height="4.2" fill="var(--accent-2)" />
      <rect x="6.5" y="2.5" width="2" height="4" fill="var(--accent-2)" />
      <rect x="15.5" y="2.5" width="2" height="4" fill="var(--accent-2)" />
      <path d="M12 11.5 13 14h2.6l-2.1 1.6.8 2.5-2.3-1.5-2.3 1.5.8-2.5-2.1-1.6H11Z" fill="var(--accent)" />
    </svg>
  );
}

// Contas — recibo/scroll
export function TabReceiptIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        d="M6 3h12v17.5l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3Z"
        fill="var(--reuniao)"
      />
      <rect x="8.3" y="7" width="7.4" height="1.4" fill="var(--surface)" />
      <rect x="8.3" y="10.2" width="7.4" height="1.4" fill="var(--surface)" />
      <rect x="8.3" y="13.4" width="4.5" height="1.4" fill="var(--surface)" />
    </svg>
  );
}

// Biblioteca — livro aberto
export function TabBookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5.2c-2.2-1.3-5-1.6-8-0.8v13.5c3-0.8 5.8-0.5 8 0.8Z" fill="var(--accent-2)" />
      <path d="M12 5.2c2.2-1.3 5-1.6 8-0.8v13.5c-3-0.8-5.8-0.5-8 0.8Z" fill="var(--accent-2)" opacity="0.72" />
    </svg>
  );
}

// Diário — caderno com caneta
export function TabDiaryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 3.5h11a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2Z" fill="var(--reuniao)" />
      <rect x="8" y="8.2" width="6.4" height="1.6" fill="var(--surface)" />
      <rect x="8" y="11.6" width="6.4" height="1.6" fill="var(--surface)" />
      <path d="M18.4 5 20.5 2.8" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Ajustes — engrenagem sólida
export function TabGearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        d="M13.2 3h-2.4l-.5 2.3a6.8 6.8 0 0 0-1.7.9L6.4 5.4 4.6 7.2l1 2.2a6.8 6.8 0 0 0-.5 1.9H2.8v2.4l2.3.5c.13.66.36 1.28.68 1.84L4.6 18l1.8 1.8 2.2-1.2c.58.34 1.2.59 1.86.74L11 21.4h2.4l.45-2.06c.66-.15 1.28-.4 1.86-.74l2.2 1.2L19.7 18l-1.27-2c.32-.56.55-1.18.68-1.84l2.3-.5v-2.4l-2.27-.5a6.8 6.8 0 0 0-.5-1.9l1-2.2-1.8-1.8-2.2 1.8a6.8 6.8 0 0 0-1.7-.9Z"
        fill="var(--text-muted)"
      />
      <circle cx="12" cy="12" r="3.2" fill="var(--surface)" />
    </svg>
  );
}

// Florzinha decorativa — usada no card de Temas da Recepção (tema Lo-fi),
// puramente decorativa (não representa nenhuma tela). Pétalas macias em vez
// do estilo pixel-art dos ícones de aba acima, pra combinar com o resto da
// vibe Lo-fi.
export function FlowerDecorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" {...props}>
      <g opacity="0.9">
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse key={angle} cx="20" cy="11.5" rx="5.2" ry="8.4" fill="var(--accent-2)" transform={`rotate(${angle} 20 20)`} />
        ))}
        <circle cx="20" cy="20" r="4.6" fill="var(--accent)" />
      </g>
    </svg>
  );
}
