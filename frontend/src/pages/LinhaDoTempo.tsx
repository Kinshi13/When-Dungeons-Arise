import { useState } from "react";
import { useCalendarData } from "../useCalendarData";
import { toDateKey, filterEntries, type TimeFilter } from "../core/domain/calendarEntries";
import TimeFilterBar from "../components/TimeFilterBar";
import { EntryRow, dayLabel } from "../components/TimelineEntryRow";

// Visão vertical cronológica: os mesmos itens do Mês/Agenda (lembretes,
// contas, feriados, aniversários), só que numa lista corrida a partir de
// hoje, sem precisar navegar mês a mês pra ver o que vem por aí.
export default function LinhaDoTempo() {
  const today = new Date();
  const year = today.getFullYear();
  const { entriesByDay } = useCalendarData(year);
  const [filter, setFilter] = useState<TimeFilter>("tudo");

  const todayKey = toDateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  const upcomingDays = [...entriesByDay.keys()]
    .filter((key) => key >= todayKey)
    .sort()
    .map((key) => ({ key, entries: filterEntries(entriesByDay.get(key)!, filter) }))
    .filter(({ entries }) => entries.length > 0);

  return (
    <div className="page">
      <TimeFilterBar value={filter} onChange={setFilter} />
      <div className="timeline">
        <div className="timeline-now">AGORA</div>
        {upcomingDays.map(({ key, entries }) => (
          <div key={key} className="timeline-day">
            <div className="timeline-day-label">{dayLabel(key, todayKey, tomorrowKey)}</div>
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        ))}
        {upcomingDays.length === 0 && <p className="hint">Nada marcado pros próximos dias.</p>}
      </div>
    </div>
  );
}
