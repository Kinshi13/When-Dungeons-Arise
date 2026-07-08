import "./ReceptionBackground.css";
import type { ReceptionBackgroundMode } from "../core/domain/receptionBackground";

interface ReceptionBackgroundProps {
  mode: ReceptionBackgroundMode;
  // Deslocamento em px já calculado (ver parallaxOffsetFor) — este
  // componente só aplica o transform, não decide o quanto mover.
  parallax?: { x: number; y: number };
}

const IMPLEMENTED_MODES: ReceptionBackgroundMode[] = ["gradient-fallback"];

// Único componente que decide o que renderizar atrás da Recepção —
// GuildReception.tsx só passa o modo, sem nenhum condicional espalhado pela
// Home (Fase 7, etapa G). "static-art"/"layered-parallax" ainda não têm
// arte de produção pronta (ver core/domain/receptionBackground.ts) e caem
// no fallback; trocar de modo no futuro só muda o corpo desta função, não
// nenhum outro lugar do app.
export default function ReceptionBackground({ mode, parallax }: ReceptionBackgroundProps) {
  const effectiveMode = IMPLEMENTED_MODES.includes(mode) ? mode : "gradient-fallback";
  const style = parallax ? { transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` } : undefined;

  if (effectiveMode === "gradient-fallback") {
    return <div className="reception-background reception-background-gradient" style={style} aria-hidden="true" />;
  }
  return null;
}
