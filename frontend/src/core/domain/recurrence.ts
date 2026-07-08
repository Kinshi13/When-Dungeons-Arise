import type { Bill } from "../../api";

// Quantidade de lançamentos futuros gerados quando uma conta vira recorrente mensal
// (11 meses à frente + a conta original = 1 ano de cobertura).
export const RECURRENCE_MONTHS_AHEAD = 11;

export function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export function buildRecurringOccurrences(
  original: Bill,
  createId: () => string,
  monthsAhead: number = RECURRENCE_MONTHS_AHEAD
): Bill[] {
  const occurrences: Bill[] = [];
  for (let i = 1; i <= monthsAhead; i++) {
    occurrences.push({
      ...original,
      id: createId(),
      dueDate: addMonths(original.dueDate, i),
      status: "PENDENTE",
      paidDate: null,
      recurring: true,
      recurrenceId: original.recurrenceId ?? original.id,
    });
  }
  return occurrences;
}
