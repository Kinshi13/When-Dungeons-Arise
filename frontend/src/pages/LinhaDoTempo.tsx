import { Link } from "react-router-dom";
import { useCalendarData } from "../useCalendarData";
import { toDateKey, type CalendarEntry } from "../game/calendarEntries";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dayLabel(dateKey: string, todayKey: string, tomorrowKey: string): string {
  if (dateKey === todayKey) return "Hoje";
  if (dateKey === tomorrowKey) return "Amanhã";
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function entryTime(entry: CalendarEntry): string | null {
  if (entry.kind === "reminder") {
    return new Date(entry.reminder.dateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return null;
}

function EntryRow({ entry }: { entry: CalendarEntry }) {
  const time = entryTime(entry);
  if (entry.kind === "reminder") {
    return (
      <div className="timeline-item">
        <span className={`dot dot-${entry.reminder.type.toLowerCase()}`} />
        <div className="timeline-item-body">
          <strong>{entry.reminder.title}</strong>
          {time && <span className="meta">{time}</span>}
        </div>
      </div>
    );
  }
  if (entry.kind === "holiday") {
    return (
      <div className="timeline-item">
        <span className="dot dot-feriado" />
        <div className="timeline-item-body">
          <strong>{entry.holiday.name}</strong>
          <span className="meta">Feriado nacional</span>
        </div>
      </div>
    );
  }
  if (entry.kind === "birthday") {
    return (
      <div className="timeline-item">
        <span className="dot dot-aniversario" />
        <div className="timeline-item-body">
          <strong>🎂 {entry.reminder.title}</strong>
          <span className="meta">Aniversário</span>
        </div>
      </div>
    );
  }
  return (
    <Link to="/tesouraria/contas" className="timeline-item">
      <span className={`dot dot-conta${entry.marker !== "vence" ? " dot-conta-paga" : ""}`} />
      <div className="timeline-item-body">
        <strong>{entry.bill.title}</strong>
        <span className="meta">{formatBRL(entry.bill.amount)}</span>
      </div>
    </Link>
  );
}

// Visão vertical cronológica: os mesmos itens do Mês/Agenda (lembretes,
// contas, feriados, aniversários), só que numa lista corrida a partir de
// hoje, sem precisar navegar mês a mês pra ver o que vem por aí.
export default function LinhaDoTempo() {
  const today = new Date();
  const year = today.getFullYear();
  const { entriesByDay } = useCalendarData("tudo", year);

  const todayKey = toDateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  const upcomingDays = [...entriesByDay.keys()]
    .filter((key) => key >= todayKey)
    .sort()
    .map((key) => ({ key, entries: entriesByDay.get(key)! }));

  return (
    <div className="page">
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
