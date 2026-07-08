import { Link } from "react-router-dom";
import type { CalendarEntry } from "../core/domain/calendarEntries";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dayLabel(dateKey: string, todayKey: string, tomorrowKey: string): string {
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

// Compartilhado por LinhaDoTempo.tsx e pelo modo "agenda" de Calendar.tsx —
// os dois mostram a mesma lista cronológica de CalendarEntry, só com
// intervalos de dias diferentes (pra sempre vs. só o mês em foco).
export function EntryRow({ entry }: { entry: CalendarEntry }) {
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
