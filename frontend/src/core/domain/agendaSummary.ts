import type { Reminder } from "../../api";
import type { Holiday } from "./holidays";
import { toDateKey } from "./calendarEntries";

export interface AgendaSummary {
  upcomingCount: number;
  nextHoliday: Holiday | null;
}

// Resumo prático da Agenda: quantos eventos/reuniões/tarefas estão chegando
// nos próximos 7 dias, e qual o próximo feriado — sem nenhuma referência a contas.
export function buildAgendaSummary(reminders: Reminder[], holidays: Holiday[]): AgendaSummary {
  const todayKey = toDateKey(new Date());
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);
  const horizonKey = toDateKey(horizon);

  const upcomingCount = reminders.filter((r) => {
    if (r.done) return false;
    const key = toDateKey(new Date(r.dateTime));
    return key >= todayKey && key <= horizonKey;
  }).length;

  const nextHoliday = holidays.find((h) => h.date >= todayKey) ?? null;

  return { upcomingCount, nextHoliday };
}
