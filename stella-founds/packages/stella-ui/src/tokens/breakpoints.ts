export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
} as const;

/** App-shell-level breakpoints (Web Fase 2): mobile <768, tablet 768–1439, desktop 1440+. Distinct from `breakpoints` above, which tunes individual component CSS. */
export const shellBreakpoints = {
  tablet: '768px',
  desktop: '1440px',
} as const;
