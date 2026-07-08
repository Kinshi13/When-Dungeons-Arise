import type { Bill, BillType, BillKind } from "../../api";

// Modelo real de recorrência (seção 9 do spec Stella Founds) — substitui o
// mecanismo antigo de só materializar 11 meses de uma vez na criação. Contas
// recorrentes já existentes de antes desta mudança continuam funcionando
// (os 12 lançamentos já materializados não somem), só não ganham mais
// geração automática de novos meses por não terem uma regra associada.
// MVP: só frequência mensal (interval = número de meses entre
// ocorrências, preparado pra "a cada 2 meses" etc., mas a UI hoje só cria
// interval=1); dueDay + startDate + endDate + reminderDaysBefore dão a base
// pra futuramente editar "esta e futuras" (mudar a regra a partir de agora)
// ou "toda a série" (mudar a regra e re-carimbar as ocorrências futuras) —
// esta entrega cobre geração/parada, não o editor completo dos 3 modos.
export interface RecurringFinanceRule {
  id: string;
  title: string;
  amount: number;
  type: BillType;
  kind: BillKind;
  priority: boolean;
  dueDay: number;
  interval: number;
  startDate: string;
  endDate?: string | null;
  reminderDaysBefore?: number;
  autoGenerate: boolean;
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
}

export const RULE_MONTHS_AHEAD = 11;

// Datas de vencimento dos próximos N meses a partir de HOJE (não a partir da
// criação da regra) — é isso que torna a geração "corrida": cada vez que
// ensureRuleOccurrences (api.ts) roda, a janela se desloca junto com o
// tempo, em vez de esgotar depois de um ano fixo como o lote antigo.
export function upcomingDueDates(rule: RecurringFinanceRule, monthsAhead = RULE_MONTHS_AHEAD, now = new Date()): string[] {
  const start = new Date(rule.startDate);
  const end = rule.endDate ? new Date(rule.endDate) : null;
  const dates: string[] = [];
  for (let i = 0; i <= monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, rule.dueDay);
    if (d < start) continue;
    if (end && d > end) break;
    dates.push(d.toISOString());
  }
  return dates;
}

// Ocorrências que ainda faltam materializar — deduplicadas por MÊS (não pelo
// dia exato), pra não duplicar se o usuário editar o vencimento de uma
// ocorrência específica sem quebrar a detecção de "já existe uma esse mês".
export function buildMissingRuleOccurrences(
  rule: RecurringFinanceRule,
  existingBillsForRule: Bill[],
  createId: () => string,
  monthsAhead = RULE_MONTHS_AHEAD,
  now = new Date()
): Bill[] {
  const existingMonths = new Set(existingBillsForRule.map((b) => b.dueDate.slice(0, 7)));
  const missing: Bill[] = [];
  for (const dueDate of upcomingDueDates(rule, monthsAhead, now)) {
    const monthKey = dueDate.slice(0, 7);
    if (existingMonths.has(monthKey)) continue;
    missing.push({
      id: createId(),
      title: rule.title,
      amount: rule.amount,
      dueDate,
      type: rule.type,
      kind: rule.kind,
      status: "PENDENTE",
      priority: rule.priority,
      paidDate: null,
      recurring: true,
      recurrenceId: rule.id,
      updatedAt: new Date().toISOString(),
      deleted: false,
    });
  }
  return missing;
}
