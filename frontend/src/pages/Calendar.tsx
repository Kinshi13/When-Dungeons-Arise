import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, type Reminder, type ReminderType } from "../api";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from "../icons";
import { playSfx } from "../sound";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const typeLabel: Record<ReminderType, string> = {
  REUNIAO: "Reunião",
  TAREFA: "Tarefa",
  OUTRO: "Outro",
};

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(toDateKey(today));
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<ReminderType>("OUTRO");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setReminders(await api.reminders.list());
  }

  useEffect(() => {
    load();
  }, []);

  const remindersByDay = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of reminders) {
      const key = toDateKey(new Date(r.dateTime));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
    return map;
  }, [reminders]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toDateKey(today);
  const dayReminders = remindersByDay.get(selectedDay) ?? [];

  function goPrevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const dateTime = new Date(`${selectedDay}T${time}`);
      await api.reminders.create({ title, dateTime: dateTime.toISOString(), type });
      setTitle("");
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    await api.reminders.remove(id);
    await load();
  }

  const selectedDateObj = new Date(`${selectedDay}T00:00:00`);

  return (
    <div className="page calendar-page">
      <div className="calendar-header">
        <button className="icon-btn" onClick={goPrevMonth} aria-label="Mês anterior">
          <ChevronLeftIcon />
        </button>
        <div className="calendar-title">
          <strong>{MONTHS[month]}</strong>
          <span>{year}</span>
        </div>
        <button className="icon-btn" onClick={goNextMonth} aria-label="Próximo mês">
          <ChevronRightIcon />
        </button>
      </div>

      <div className="month-strip">
        {MONTHS_SHORT.map((m, i) => (
          <button
            key={m}
            className={i === month ? "month-chip active" : "month-chip"}
            onClick={() => setMonth(i)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="weekday-row">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="month-grid">
        {grid.map((date, i) => {
          if (!date) return <div key={i} className="day-cell empty" />;
          const key = toDateKey(date);
          const dayItems = remindersByDay.get(key) ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          return (
            <motion.button
              key={i}
              className={`day-cell${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}`}
              onClick={() => setSelectedDay(key)}
              whileTap={{ scale: 0.85 }}
              animate={isSelected ? { scale: 1.06 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
            >
              <span className="day-number">{date.getDate()}</span>
              {dayItems.length > 0 && (
                <span className="day-dots">
                  {dayItems.slice(0, 3).map((r) => (
                    <span key={r.id} className={`dot dot-${r.type.toLowerCase()}`} />
                  ))}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={selectedDay}
          className="day-panel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
        <h2>
          {selectedDateObj.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </h2>

        <ul className="list">
          {dayReminders.map((r) => (
            <li key={r.id} className="reminder-item">
              <div>
                <span className={`dot dot-${r.type.toLowerCase()}`} />
                <strong>{r.title}</strong>
                <div className="meta">
                  {new Date(r.dateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {typeLabel[r.type]}
                </div>
              </div>
              <button className="icon-btn" onClick={() => handleDelete(r.id)} aria-label="Excluir lembrete">
                <TrashIcon width={18} height={18} />
              </button>
            </li>
          ))}
          {dayReminders.length === 0 && <p className="hint">Nenhum lembrete neste dia.</p>}
        </ul>

        <form onSubmit={handleSubmit} className="form day-form">
          <input
            placeholder="Novo lembrete"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => playSfx("drop")}
            required
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onFocus={() => playSfx("drop")}
            required
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReminderType)}
            onFocus={() => playSfx("drop")}
          >
            <option value="REUNIAO">Reunião</option>
            <option value="TAREFA">Tarefa</option>
            <option value="OUTRO">Outro</option>
          </select>
          <button type="submit" className="icon-btn primary" aria-label="Adicionar lembrete">
            <PlusIcon />
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
