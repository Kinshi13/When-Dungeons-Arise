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

// Filtro de categoria em Tempo (Calendário e Linha do Tempo) — seção 6 do
// spec Stella Founds. Feriado e aniversário não têm chip próprio (o spec só
// pede Tudo/Tarefas/Eventos/Reuniões/Finanças); entram em "Eventos" por
// serem, semanticamente, eventos do dia.
export type TimeFilter = "tudo" | "tarefas" | "eventos" | "reunioes" | "financas";

export const TIME_FILTER_ORDER: TimeFilter[] = ["tudo", "tarefas", "eventos", "reunioes", "financas"];

export const TIME_FILTER_LABEL: Record<TimeFilter, string> = {
  tudo: "Tudo",
  tarefas: "Tarefas",
  eventos: "Eventos",
  reunioes: "Reuniões",
  financas: "Finanças",
};

export function matchesTimeFilter(entry: CalendarEntry, filter: TimeFilter): boolean {
  if (filter === "tudo") return true;
  if (entry.kind === "bill") return filter === "financas";
  if (filter === "financas") return false;
  if (entry.kind === "holiday" || entry.kind === "birthday") return filter === "eventos";
  if (filter === "tarefas") return entry.reminder.type === "TAREFA";
  if (filter === "reunioes") return entry.reminder.type === "REUNIAO";
  return entry.reminder.type === "OUTRO";
}

export function filterEntries(entries: CalendarEntry[], filter: TimeFilter): CalendarEntry[] {
  return entries.filter((entry) => matchesTimeFilter(entry, filter));
}

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
