import type { Bill, Reminder } from "../../api";
import type { Holiday } from "./holidays";

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type CalendarEntry =
  | { kind: "reminder"; id: string; reminder: Reminder }
  | { kind: "bill"; id: string; bill: Bill; marker: "vence" | "paga" | "recebida" }
  | { kind: "holiday"; id: string; holiday: Holiday }
  | { kind: "birthday"; id: string; reminder: Reminder; year: number };

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

// Aniversário projetado num ano específico — dia/mês fixos de dateTime,
// repetindo todo ano (mesmo raciocínio de getBrazilianHolidays), em vez de
// aparecer só na data exata em que foi cadastrado.
function birthdayOccurrenceKey(reminder: Reminder, year: number): string {
  const original = new Date(reminder.dateTime);
  return toDateKey(new Date(year, original.getMonth(), original.getDate()));
}

export function buildCalendarEntries(
  reminders: Reminder[],
  bills: Bill[] = [],
  holidays: Holiday[] = [],
  years: number[] = []
): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();

  function push(key: string, entry: CalendarEntry) {
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }

  for (const reminder of reminders) {
    if (reminder.isBirthday) continue;
    push(toDateKey(new Date(reminder.dateTime)), { kind: "reminder", id: reminder.id, reminder });
  }

  for (const bill of bills) {
    const { key, marker } = billMarkerDate(bill);
    push(key, { kind: "bill", id: bill.id, bill, marker });
  }

  for (const holiday of holidays) {
    push(holiday.date, { kind: "holiday", id: `holiday-${holiday.date}`, holiday });
  }

  for (const year of years) {
    for (const reminder of reminders) {
      if (!reminder.isBirthday) continue;
      push(birthdayOccurrenceKey(reminder, year), {
        kind: "birthday",
        id: `birthday-${reminder.id}-${year}`,
        reminder,
        year,
      });
    }
  }

  return map;
}
