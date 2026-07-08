// Fonte única dos 3 modos de layout (seção 12 do spec Stella Founds).
// CSS custom properties não conseguem dirigir condição de @media, então os
// mesmos números precisam ser repetidos como literais nos media queries do
// CSS — mantenha os dois em sincronia se mudar aqui.
export const BREAKPOINTS = {
  tablet: 720,
  desktop: 1080,
} as const;

export type LayoutMode = "mobile" | "tablet" | "desktop";

export function layoutModeOf(width: number): LayoutMode {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}
