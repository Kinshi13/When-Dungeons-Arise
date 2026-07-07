import { useEffect, useMemo, useState, useCallback } from "react";
import { api, type Bill, type Reminder } from "./api";
import { buildCalendarEntries, type CalendarEntry } from "./game/calendarEntries";
import { getBrazilianHolidays, type Holiday } from "./game/holidays";

// "financas": só contas (sem feriado) — grade da Tesouraria/Mês. "agenda":
// só feriados (sem conta) — grade de eventos/aniversário. "tudo": os dois
// juntos, usado pela Linha do Tempo, que precisa ver todo tipo de item
// numa lista só, sem a separação que faz sentido nas duas grades mensais.
export type CalendarVariant = "financas" | "agenda" | "tudo";

// Busca compartilhada por Calendar.tsx (Mês) e LinhaDoTempo.tsx — os dois
// precisam dos mesmos insumos (lembretes, contas quando faz sentido,
// feriados quando faz sentido) e da mesma fusão via buildCalendarEntries,
// então cada um teria que duplicar essa lógica sem esse hook. Não inclui a
// busca própria do resumo do PixelDialogBox em TimeRoom.tsx — esse precisa
// sempre de contas E lembretes juntos, independente da aba ativa, um
// formato diferente do que este hook resolve.
export function useCalendarData(variant: CalendarVariant, year: number) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const load = useCallback(async () => {
    const [remindersData, billsData] = await Promise.all([
      api.reminders.list(),
      variant === "agenda" ? Promise.resolve([]) : api.bills.list(),
    ]);
    setReminders(remindersData);
    setBills(billsData);
  }, [variant]);

  useEffect(() => {
    load();
  }, [load]);

  const holidays: Holiday[] = useMemo(
    () => (variant === "financas" ? [] : getBrazilianHolidays(year)),
    [variant, year]
  );

  const entriesByDay: Map<string, CalendarEntry[]> = useMemo(
    () => buildCalendarEntries(reminders, bills, holidays, year),
    [reminders, bills, holidays, year]
  );

  return { reminders, bills, holidays, entriesByDay, reload: load };
}
