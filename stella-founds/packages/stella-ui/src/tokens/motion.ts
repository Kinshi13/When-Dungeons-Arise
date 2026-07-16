export const duration = {
  fast: 0.12,
  normal: 0.22,
  slow: 0.4,
} as const;

export const easing = {
  standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
  emphasized: [0.16, 1, 0.3, 1] as [number, number, number, number],
  exit: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

export const stagger = {
  short: 0.06,
  normal: 0.1,
} as const;
