import type { SVGProps } from "react";
import { useSettings, isLofiTheme } from "./contexts/SettingsContext";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
  shapeRendering: "crispEdges",
};

// Ícones flat (família Lo-fi, claro e escuro): formas sólidas preenchidas,
// cantos arredondados e uma sombra leve — nada de contornos/traços "pixel
// art". O "recorte" nos detalhes (marca de check, aros do calendário etc.)
// usa a cor de superfície do tema ativo, então funciona tanto no Lo-fi
// creme quanto na versão escura acinzentada.
const LOFI_CREAM = "var(--surface)";

const lofiBase: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  style: { filter: "drop-shadow(1px 2px 1.5px rgba(20, 16, 12, 0.35))" },
};

function useLofi() {
  return isLofiTheme(useSettings().theme);
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <rect x="3" y="4.5" width="18" height="16.5" rx="4.5" fill="currentColor" />
        <rect x="6.7" y="2.2" width="2.4" height="5" rx="1.2" fill="currentColor" />
        <rect x="14.9" y="2.2" width="2.4" height="5" rx="1.2" fill="currentColor" />
        <circle cx="12" cy="14" r="2.6" fill={LOFI_CREAM} />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" fill="currentColor" />
        <rect x="10" y="18.6" width="4" height="2.4" rx="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChecklistIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        {[4.2, 10.2, 16.2].map((y) => (
          <g key={y}>
            <rect x="3" y={y} width="5.4" height="5.4" rx="1.8" fill="currentColor" />
            <path
              d={`M4.4 ${y + 2.9} l1.1 1.1 2-2.3`}
              stroke={LOFI_CREAM}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <rect x="11" y={y + 1.1} width="10" height="3.2" rx="1.6" fill="currentColor" opacity="0.55" />
          </g>
        ))}
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="m4 6 1.5 1.5L8 5" />
      <path d="M11 6h9" />
      <path d="m4 13 1.5 1.5L8 12" />
      <path d="M11 13h9" />
      <path d="m4 20 1.5 1.5L8 19" />
      <path d="M11 20h9" />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <rect x="3" y="5.6" width="18" height="2.8" rx="1.4" fill="currentColor" opacity="0.4" />
        <circle cx="8.2" cy="7" r="2.8" fill="currentColor" />
        <rect x="3" y="10.6" width="18" height="2.8" rx="1.4" fill="currentColor" opacity="0.4" />
        <circle cx="16.2" cy="12" r="2.8" fill="currentColor" />
        <rect x="3" y="15.6" width="18" height="2.8" rx="1.4" fill="currentColor" opacity="0.4" />
        <circle cx="10.2" cy="17" r="2.8" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .35 1.9l.05.05a2 2 0 1 1-2.85 2.85l-.05-.05a1.7 1.7 0 0 0-1.9-.35 1.7 1.7 0 0 0-1 1.55V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.9.35l-.05.05a2 2 0 1 1-2.85-2.85l.05-.05a1.7 1.7 0 0 0 .35-1.9 1.7 1.7 0 0 0-1.55-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.35-1.9l-.05-.05a2 2 0 1 1 2.85-2.85l.05.05a1.7 1.7 0 0 0 1.9.35h.05a1.7 1.7 0 0 0 1-1.55V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.55h.05a1.7 1.7 0 0 0 1.9-.35l.05-.05a2 2 0 1 1 2.85 2.85l-.05.05a1.7 1.7 0 0 0-.35 1.9v.05a1.7 1.7 0 0 0 1.55 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1.05Z" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <rect x="10.2" y="4" width="3.6" height="16" rx="1.8" fill="currentColor" />
        <rect x="4" y="10.2" width="16" height="3.6" rx="1.8" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <rect x="9" y="2.6" width="6" height="3" rx="1.2" fill="currentColor" />
        <rect x="4" y="6" width="16" height="2.6" rx="1.3" fill="currentColor" />
        <path d="M6.3 8.6h11.4l-0.9 11.6a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8Z" fill="currentColor" />
        <rect x="10" y="11" width="1.8" height="7" rx="0.9" fill={LOFI_CREAM} opacity="0.8" />
        <rect x="13" y="11" width="1.8" height="7" rx="0.9" fill={LOFI_CREAM} opacity="0.8" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M6 7l1 13.5A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
    </svg>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M15.5 4.5a2 2 0 0 1 1.3 3.5L11.5 12l5.3 4a2 2 0 0 1-1.3 3.5 2 2 0 0 1-1.2-.4l-6.8-5.6a2 2 0 0 1 0-3l6.8-5.6a2 2 0 0 1 1.2-.4Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M8.5 4.5a2 2 0 0 0-1.3 3.5l5.3 4-5.3 4a2 2 0 0 0 1.3 3.5 2 2 0 0 0 1.2-.4l6.8-5.6a2 2 0 0 0 0-3L9.7 4.9a2 2 0 0 0-1.2-.4Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function CoinIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <circle cx="12" cy="12" r="8.6" fill="currentColor" />
        <rect x="11" y="6.5" width="2" height="11" rx="1" fill={LOFI_CREAM} opacity="0.85" />
        <path
          d="M9.3 9.5c0-1.3 1.2-2.1 2.7-2.1s2.7.8 2.7 2"
          stroke={LOFI_CREAM}
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 9.7c0-1.2 1.1-2 2.5-2s2.5.7 2.5 1.8-1 1.5-2.5 2-2.5.9-2.5 2 1.1 1.8 2.5 1.8 2.5-.8 2.5-2" />
    </svg>
  );
}

export function InvoiceIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M6 2.5h12v18.6l-2.5-1.5-2.5 1.5-2.5-1.5L8 21.1l-2-1.5Z" fill="currentColor" />
        <rect x="8.5" y="7.2" width="7" height="1.8" rx="0.9" fill={LOFI_CREAM} opacity="0.85" />
        <rect x="8.5" y="10.8" width="7" height="1.8" rx="0.9" fill={LOFI_CREAM} opacity="0.85" />
        <rect x="8.5" y="14.4" width="4" height="1.8" rx="0.9" fill={LOFI_CREAM} opacity="0.85" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.6V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </svg>
  );
}

export function BookIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M4 4c2.2-1 5-1 8 0.2v14.8c-3-1.2-5.8-1.2-8-0.2Z" fill="currentColor" />
        <path d="M20 4c-2.2-1-5-1-8 0.2v14.8c3-1.2 5.8-1.2 8-0.2Z" fill="currentColor" opacity="0.7" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M4 4.5c2-1 5-1 8 0v15c-3-1-6-1-8 0Z" />
      <path d="M20 4.5c-2-1-5-1-8 0v15c3-1 6-1 8 0Z" />
    </svg>
  );
}

export function CalculatorIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <rect x="4.5" y="2.5" width="15" height="19" rx="3" fill="currentColor" />
        <rect x="7" y="5" width="10" height="4.5" rx="1.4" fill={LOFI_CREAM} opacity="0.85" />
        {[7.4, 11.3, 15.2].flatMap((x) =>
          [12.2, 16.1].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.35" fill={LOFI_CREAM} opacity="0.85" />)
        )}
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <rect x="7.5" y="5.5" width="9" height="3.5" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01" strokeWidth="2.4" />
    </svg>
  );
}

export function DiaryIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2Z" fill="currentColor" />
        <rect x="8.5" y="8.5" width="6" height="1.7" rx="0.85" fill={LOFI_CREAM} opacity="0.85" />
        <rect x="8.5" y="12.5" width="6" height="1.7" rx="0.85" fill={LOFI_CREAM} opacity="0.85" />
        <circle cx="19" cy="6.5" r="2" fill="currentColor" opacity="0.7" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V4Z" />
      <path d="M9 9h5M9 13h5" />
      <path d="M19 8.5 21 6" />
    </svg>
  );
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <rect x="4" y="10.2" width="16" height="3.6" rx="1.8" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  );
}

// Central de notificações (leitura de notificações de outros apps) — de
// propósito diferente do BellIcon, que já significa "lembretes" no resto do
// app (formulário do Mural, Ajustes de notificação local).
export function InboxIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M4 7.5 12 3l8 4.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" fill="currentColor" />
        <path d="M4 9.5 12 15l8-5.5" stroke={LOFI_CREAM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
        <circle cx="18.3" cy="5.3" r="3" fill="var(--danger)" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 9.5 12 15l9-5.5" />
      <circle cx="18" cy="5.5" r="3" fill="var(--danger)" stroke="none" />
    </svg>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5Z" />
    </svg>
  );
}

export function ChevronUpIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M4.5 15.5a2 2 0 0 1 3.5-1.3l4-5.3 4 5.3a2 2 0 0 1-3.5 1.3l-.4-.4v0l-.1.1a2 2 0 0 1-3 0l-.1-.1v0l-.4.4a2 2 0 0 1-3.4-1.3Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <path d="M19.5 8.5a2 2 0 0 0-3.5-1.3l-4 5.3-4-5.3a2 2 0 0 0-3.4 1.3 2 2 0 0 0 .4 1.2l5.6 6.8a2 2 0 0 0 3 0l5.6-6.8a2 2 0 0 0 .3-1.2Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ProfileIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <circle cx="12" cy="8" r="3.8" fill="currentColor" />
        <path d="M5 20c1.2-3.8 4-5.5 7-5.5s5.8 1.7 7 5.5a1.4 1.4 0 0 1-1.3 1.9H6.3A1.4 1.4 0 0 1 5 20Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.8 4-5.5 7-5.5s5.8 1.7 7 5.5" />
    </svg>
  );
}

// Ampulheta — botão do Relógio na Recepção.
export function HourglassIcon(props: SVGProps<SVGSVGElement>) {
  if (useLofi()) {
    return (
      <svg {...lofiBase} {...props}>
        <rect x="5" y="2.4" width="14" height="2.6" rx="1.3" fill="currentColor" />
        <rect x="5" y="19" width="14" height="2.6" rx="1.3" fill="currentColor" />
        <path d="M7 5h10v1.8c0 2.4-1.8 3.8-3.4 5.2 1.6 1.4 3.4 2.8 3.4 5.2V19H7v-1.8c0-2.4 1.8-3.8 3.4-5.2C8.8 10.6 7 9.2 7 6.8Z" fill="currentColor" opacity="0.45" />
        <path d="M9 6.2h6c0 1.8-1.4 2.9-3 4.1-1.6-1.2-3-2.3-3-4.1Z" fill="currentColor" />
        <path d="M12 14.2c1.6 1.2 3 2.3 3 3.8H9c0-1.5 1.4-2.6 3-3.8Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...base} {...props}>
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3v2.5c0 2.5 2 4 5 6.5-3 2.5-5 4-5 6.5V21M17 3v2.5c0 2.5-2 4-5 6.5 3 2.5 5 4 5 6.5V21" />
    </svg>
  );
}
