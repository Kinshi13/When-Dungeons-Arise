// Tipos do sistema único de input adaptativo de parallax (Fase 7, etapa H
// evoluída) — pointer (desktop), device-orientation (mobile, quando
// permitido) e touch (fallback mobile) alimentam o MESMO estado normalizado;
// nenhuma camada (PNG ou SVG) sabe de onde o movimento veio.
export type ParallaxInputSource = "pointer" | "device-orientation" | "touch" | "idle";

export interface ParallaxInputState {
  x: number; // -1 a 1
  y: number; // -1 a 1
  source: ParallaxInputSource;
  active: boolean;
}

export type SensorPermissionState = "unknown" | "granted" | "denied" | "unsupported";
