// Curva de progressão: cada nível pede progressivamente mais XP.
// nível 1 = 0xp, nível 2 = 50xp, nível 3 = 200xp, nível 4 = 450xp...
export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(xp, 0) / 50)) + 1;
}

export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}

export function xpProgressInLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const current = xp - floor;
  const needed = ceiling - floor;
  return { current, needed, percent: needed > 0 ? Math.min(100, (current / needed) * 100) : 100 };
}
