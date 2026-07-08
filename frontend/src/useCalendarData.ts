import { useEffect, useMemo, useState, useCallback } from "react";
import { api, type Bill, type Reminder } from "./api";
import { buildCalendarEntries, type CalendarEntry } from "./core/domain/calendarEntries";
import { getBrazilianHolidays, type Holiday } from "./core/domain/holidays";

// Busca compartilhada por Calendar.tsx (Mês/Agenda) e LinhaDoTempo.tsx — os
// três sempre precisam dos mesmos insumos completos (lembretes, contas,
// feriados) fundidos via buildCalendarEntries; qual categoria aparece de
// fato é decidido depois, pelo filtro de Tempo (ver TimeFilter em
// calendarEntries.ts), não mais restringindo o que é buscado. Não inclui a
// busca própria do resumo do PixelDialogBox em TimeRoom.tsx — esse precisa
// sempre de contas E lembretes juntos, independente da aba ativa, um
// formato diferente do que este hook resolve.
export function useCalendarData(year: number) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  const load = useCallback(async () => {
    const [remindersData, billsData] = await Promise.all([api.reminders.list(), api.bills.list()]);
    setReminders(remindersData);
    setBills(billsData);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Também inclui o ano seguinte (feriados e aniversários recorrentes) —
  // sem isso, perto do fim do ano a Linha do Tempo (que não navega de ano
  // como o Mês faz) escondia feriados/aniversários de janeiro seguinte só
  // porque a busca nunca ia além de 31/12. Mesmo raciocínio já usado em
  // Settings.tsx's upcomingHolidays().
  const holidays: Holiday[] = useMemo(
    () => [...getBrazilianHolidays(year), ...getBrazilianHolidays(year + 1)],
    [year]
  );

  const entriesByDay: Map<string, CalendarEntry[]> = useMemo(
    () => buildCalendarEntries(reminders, bills, holidays, [year, year + 1]),
    [reminders, bills, holidays, year]
  );

  return { reminders, bills, holidays, entriesByDay, reload: load };
}
