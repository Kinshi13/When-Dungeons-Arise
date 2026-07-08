import "./ReceptionBackground.css";
import type { ReceptionBackgroundMode } from "../core/domain/receptionBackground";

interface ReceptionBackgroundProps {
  mode: ReceptionBackgroundMode;
}

const IMPLEMENTED_MODES: ReceptionBackgroundMode[] = ["gradient-fallback"];

// Único componente que decide o que renderizar atrás da Recepção —
// GuildReception.tsx só passa o modo, sem nenhum condicional espalhado pela
// Home (Fase 7, etapa G). "static-art"/"layered-parallax" ainda não têm
// arte de produção pronta (ver core/domain/receptionBackground.ts) e caem
// no fallback; trocar de modo no futuro só muda o corpo desta função, não
// nenhum outro lugar do app.
export default function ReceptionBackground({ mode }: ReceptionBackgroundProps) {
  const effectiveMode = IMPLEMENTED_MODES.includes(mode) ? mode : "gradient-fallback";

  if (effectiveMode === "gradient-fallback") {
    return <div className="reception-background reception-background-gradient" aria-hidden="true" />;
  }
  return null;
}
