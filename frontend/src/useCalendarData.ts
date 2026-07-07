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

  // Também inclui o ano seguinte (feriados e aniversários recorrentes) —
  // sem isso, perto do fim do ano a Linha do Tempo (que não navega de ano
  // como o Mês faz) escondia feriados/aniversários de janeiro seguinte só
  // porque a busca nunca ia além de 31/12. Mesmo raciocínio já usado em
  // Settings.tsx's upcomingHolidays().
  const holidays: Holiday[] = useMemo(
    () => (variant === "financas" ? [] : [...getBrazilianHolidays(year), ...getBrazilianHolidays(year + 1)]),
    [variant, year]
  );

  const entriesByDay: Map<string, CalendarEntry[]> = useMemo(
    () => buildCalendarEntries(reminders, bills, holidays, [year, year + 1]),
    [reminders, bills, holidays, year]
  );

  return { reminders, bills, holidays, entriesByDay, reload: load };
}
