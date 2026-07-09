import type { SensorPermissionState } from "./types";

// Tipagem mínima do requestPermission do Safari/iOS — não faz parte do
// lib.dom.d.ts padrão (só existe em iOS 13+, atrás de um gesto explícito).
interface OrientationCtorWithPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

function orientationCtor(): OrientationCtorWithPermission | undefined {
  if (typeof DeviceOrientationEvent === "undefined") return undefined;
  return DeviceOrientationEvent as unknown as OrientationCtorWithPermission;
}

export function isOrientationSupported(): boolean {
  return typeof window !== "undefined" && typeof DeviceOrientationEvent !== "undefined";
}

// true só no iOS 13+ Safari — Android e desktop com sensor disparam o
// evento direto, sem pedir nada.
export function requiresExplicitPermission(): boolean {
  return typeof orientationCtor()?.requestPermission === "function";
}

export function initialPermissionState(): SensorPermissionState {
  if (!isOrientationSupported()) return "unsupported";
  return requiresExplicitPermission() ? "unknown" : "granted";
}

// Só deve ser chamada a partir de um gesto explícito do usuário (seção 4 do
// briefing: nunca pedir automaticamente) — o "Ativar movimento da cena".
export async function requestOrientationPermission(): Promise<SensorPermissionState> {
  const ctor = orientationCtor();
  if (!ctor?.requestPermission) return "granted"; // não exige gesto, já dispara sozinho
  try {
    const result = await ctor.requestPermission();
    return result === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}
