import type { Bill } from "../api";
import { toDateKey } from "./calendarEntries";

export interface PendingBillDay {
  dateKey: string;
  label: string;
  count: number;
  totalAmount: number;
}

function formatShortDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Resumo dos dias mais próximos com contas pendentes — usado nas caixas de
// diálogo (ex: Sala do Tempo) como um mini painel de pendências.
export function buildPendingBillsSummary(bills: Bill[], limit = 3): PendingBillDay[] {
  const todayKey = toDateKey(new Date());
  const byDay = new Map<string, Bill[]>();

  for (const bill of bills) {
    if (bill.status !== "PENDENTE") continue;
    const key = toDateKey(new Date(bill.dueDate));
    if (key < todayKey) continue;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(bill);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, limit)
    .map(([dateKey, items]) => ({
      dateKey,
      label: formatShortDate(dateKey),
      count: items.length,
      totalAmount: items.reduce((sum, b) => sum + b.amount, 0),
    }));
}
