export const REWARDS = {
  taskSimples: { xp: 10, coins: 10 },
  taskMedia: { xp: 25, coins: 25 },
  taskImportante: { xp: 50, coins: 50 },
  leitura20min: { xp: 30, coins: 0 },
  notaCriada: { xp: 10, coins: 0 },
  despesaRegistrada: { xp: 15, coins: 0 },
  contaPaga: { xp: 15, coins: 10 },
  eventoCriado: { xp: 15, coins: 0 },
  comboTresTarefas: { xp: 50, coins: 0 },
} as const;

export type RewardKey = keyof typeof REWARDS;
export type Reward = { xp: number; coins: number };

export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isConsecutiveDay(previousDateKey: string | null, currentDateKey: string): boolean {
  if (!previousDateKey) return false;
  const prev = new Date(`${previousDateKey}T00:00:00`);
  const curr = new Date(`${currentDateKey}T00:00:00`);
  const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// Bônus de moedas pela sequência diária — cresce com o streak, com teto pra não inflacionar.
export function streakBonusCoins(streak: number): number {
  return Math.min(streak * 10, 100);
}
