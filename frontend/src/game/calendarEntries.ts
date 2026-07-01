import type { Bill, Reminder } from "../api";

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type CalendarEntry =
  | { kind: "reminder"; id: string; reminder: Reminder }
  | { kind: "bill"; id: string; bill: Bill; marker: "vence" | "paga" | "recebida" };

// Contas aparecem no dia do vencimento (pendentes) ou no dia em que foram
// pagas/recebidas — nunca nos dois ao mesmo tempo.
function billMarkerDate(bill: Bill): { key: string; marker: "vence" | "paga" | "recebida" } {
  if (bill.status === "PAGA" && bill.paidDate) {
    return { key: toDateKey(new Date(bill.paidDate)), marker: "paga" };
  }
  if (bill.status === "RECEBIDA" && bill.paidDate) {
    return { key: toDateKey(new Date(bill.paidDate)), marker: "recebida" };
  }
  return { key: toDateKey(new Date(bill.dueDate)), marker: "vence" };
}

export function buildCalendarEntries(reminders: Reminder[], bills: Bill[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();

  function push(key: string, entry: CalendarEntry) {
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  for (const reminder of reminders) {
    push(toDateKey(new Date(reminder.dateTime)), { kind: "reminder", id: reminder.id, reminder });
  }

  for (const bill of bills) {
    const { key, marker } = billMarkerDate(bill);
    push(key, { kind: "bill", id: bill.id, bill, marker });
  }

  return map;
}
