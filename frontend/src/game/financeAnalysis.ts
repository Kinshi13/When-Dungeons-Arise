import type { DailySummary, Expense } from "../api";

export interface PeriodComparison {
  currentTotal: number;
  previousTotal: number;
  // null quando não há como comparar (período anterior sem nenhum gasto).
  percentChange: number | null;
}

export interface FrequentExpense {
  description: string;
  count: number;
  total: number;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Domingo — mesma convenção já usada no Calendário/Agenda (WEEKDAYS começa em "Dom").
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}

function sumTotals(summaries: DailySummary[], fromKey: string, toKey: string): number {
  return summaries
    .filter((s) => s.date >= fromKey && s.date <= toKey)
    .reduce((sum, s) => sum + s.total, 0);
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return ((current - previous) / previous) * 100;
}

// Compara a semana atual (de domingo até hoje) com o mesmo intervalo de dias
// da semana passada (de domingo até o mesmo dia da semana) — uma comparação
// justa mesmo com a semana corrente ainda incompleta.
export function compareWeek(summaries: DailySummary[], today: Date): PeriodComparison {
  const thisWeekStart = startOfWeek(today);
  const daysElapsed = today.getDay(); // 0 (domingo) a 6 (sábado)
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekSamePoint = new Date(lastWeekStart);
  lastWeekSamePoint.setDate(lastWeekSamePoint.getDate() + daysElapsed);

  const currentTotal = sumTotals(summaries, toDateKey(thisWeekStart), toDateKey(today));
  const previousTotal = sumTotals(summaries, toDateKey(lastWeekStart), toDateKey(lastWeekSamePoint));

  return { currentTotal, previousTotal, percentChange: percentChange(currentTotal, previousTotal) };
}

// Mesma ideia pro mês: do dia 1 até hoje, comparado com o dia 1 até o mesmo
// dia do mês anterior (limitado ao último dia daquele mês, caso ele seja
// mais curto — ex.: comparar 31 de julho com fevereiro cai no dia 28/29).
export function compareMonth(summaries: DailySummary[], today: Date): PeriodComparison {
  const thisMonthStart = startOfMonth(today);
  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthLength = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth() + 1, 0).getDate();
  const lastMonthSamePoint = new Date(lastMonthStart);
  lastMonthSamePoint.setDate(Math.min(today.getDate(), lastMonthLength));

  const currentTotal = sumTotals(summaries, toDateKey(thisMonthStart), toDateKey(today));
  const previousTotal = sumTotals(summaries, toDateKey(lastMonthStart), toDateKey(lastMonthSamePoint));

  return { currentTotal, previousTotal, percentChange: percentChange(currentTotal, previousTotal) };
}

// Gastos que se repetem — agrupados pela descrição (normalizada), contando só
// quem tem descrição preenchida e aparece pelo menos minCount vezes no período.
export function findFrequentExpenses(expenses: Expense[], sinceDate: Date, minCount = 3): FrequentExpense[] {
  const sinceKey = toDateKey(sinceDate);
  const groups = new Map<string, { count: number; total: number }>();

  for (const exp of expenses) {
    const description = exp.description?.trim();
    if (!description) continue;
    if (toDateKey(new Date(exp.date)) < sinceKey) continue;
    const key = description.toLowerCase();
    const entry = groups.get(key) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += exp.amount;
    groups.set(key, entry);
  }

  return [...groups.entries()]
    .filter(([, v]) => v.count >= minCount)
    .map(([description, v]) => ({ description, count: v.count, total: v.total }))
    .sort((a, b) => b.total - a.total);
}

// Soma dos gastos marcados como supérfluos no período — quanto sobraria se
// esses itens fossem cortados do orçamento.
export function superficialTotal(expenses: Expense[], fromDate: Date, toDate: Date): number {
  const fromKey = toDateKey(fromDate);
  const toKey = toDateKey(toDate);
  return expenses
    .filter((e) => e.superficial && toDateKey(new Date(e.date)) >= fromKey && toDateKey(new Date(e.date)) <= toKey)
    .reduce((sum, e) => sum + e.amount, 0);
}
