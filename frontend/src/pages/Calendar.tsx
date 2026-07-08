import { useMemo, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { api, type ReminderType } from "../api";
import { toDateKey, type CalendarEntry } from "../core/domain/calendarEntries";
import { useCalendarData } from "../useCalendarData";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from "../icons";
import { playSfx } from "../sound";
import { useQuickAction } from "../useQuickAction";

interface CalendarProps {
  variant?: "financas" | "agenda";
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const typeLabel: Record<ReminderType, string> = {
  REUNIAO: "Reunião",
  TAREFA: "Tarefa",
  OUTRO: "Evento",
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function billNoteLabel(entry: Extract<CalendarEntry, { kind: "bill" }>) {
  if (entry.marker === "paga") return "Conta paga";
  if (entry.marker === "recebida") return "Recebido";
  return entry.bill.kind === "RECEBER" ? "A receber" : "Vencimento";
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

export default function Calendar({ variant = "financas" }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(toDateKey(today));
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState<ReminderType>("OUTRO");
  const [isBirthday, setIsBirthday] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { entriesByDay, reload: load } = useCalendarData(variant, year);

  useQuickAction("novo-evento", () => titleInputRef.current?.focus());

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toDateKey(today);
  const dayEntries = entriesByDay.get(selectedDay) ?? [];

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
      const dateTime = new Date(`${selectedDay}T${isBirthday ? "00:00" : time}`);
      await api.reminders.create({
        title,
        dateTime: dateTime.toISOString(),
        type: isBirthday ? "OUTRO" : type,
        isBirthday,
        birthYear: isBirthday && birthYear ? Number(birthYear) : null,
      });
      setTitle("");
      setIsBirthday(false);
      setBirthYear("");
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
      <div className="calendar-panel">
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
            const dayItems = entriesByDay.get(key) ?? [];
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
                    {dayItems.slice(0, 3).map((entry) => {
                      if (entry.kind === "reminder") {
                        return (
                          <span
                            key={entry.id}
                            className={`dot dot-${entry.reminder.type.toLowerCase()}`}
                            style={entry.reminder.fromNote ? { opacity: 0.85 } : undefined}
                          />
                        );
                      }
                      if (entry.kind === "holiday") {
                        return <span key={entry.id} className="dot dot-feriado" />;
                      }
                      if (entry.kind === "birthday") {
                        return <span key={entry.id} className="dot dot-aniversario" />;
                      }
                      return (
                        <span
                          key={entry.id}
                          className={`dot dot-conta${entry.marker !== "vence" ? " dot-conta-paga" : ""}`}
                        />
                      );
                    })}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
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
          {dayEntries.map((entry) => {
            if (entry.kind === "reminder") {
              return (
                <li
                  key={entry.id}
                  className="reminder-item"
                  style={entry.reminder.fromNote ? { opacity: 0.85 } : undefined}
                >
                  <div>
                    <span className={`dot dot-${entry.reminder.type.toLowerCase()}`} />
                    <strong>{entry.reminder.title}</strong>
                    <div className="meta">
                      {new Date(entry.reminder.dateTime).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {typeLabel[entry.reminder.type]}
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => handleDelete(entry.id)} aria-label="Excluir lembrete">
                    <TrashIcon width={18} height={18} />
                  </button>
                </li>
              );
            }
            if (entry.kind === "holiday") {
              return (
                <li key={entry.id} className="reminder-item">
                  <div>
                    <span className="dot dot-feriado" />
                    <strong>{entry.holiday.name}</strong>
                    <div className="meta">Feriado nacional</div>
                  </div>
                </li>
              );
            }
            if (entry.kind === "birthday") {
              const age = entry.reminder.birthYear ? entry.year - entry.reminder.birthYear : null;
              return (
                <li key={entry.id} className="reminder-item">
                  <div>
                    <span className="dot dot-aniversario" />
                    <strong>🎂 {entry.reminder.title}</strong>
                    <div className="meta">Aniversário{age ? ` · completa ${age} anos` : ""}</div>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => handleDelete(entry.reminder.id)}
                    aria-label="Excluir aniversário"
                  >
                    <TrashIcon width={18} height={18} />
                  </button>
                </li>
              );
            }
            return (
              <li key={entry.id} className="reminder-item calendar-bill-note">
                <Link to="/tesouraria/contas">
                  <span className={`dot dot-conta${entry.marker !== "vence" ? " dot-conta-paga" : ""}`} />
                  <strong>{entry.bill.title}</strong>
                  <div className="meta">
                    {formatBRL(entry.bill.amount)} · {billNoteLabel(entry)}
                  </div>
                </Link>
              </li>
            );
          })}
          {dayEntries.length === 0 && <p className="hint">Nada marcado neste dia.</p>}
        </ul>

        <form onSubmit={handleSubmit} className="form day-form">
          <input
            ref={titleInputRef}
            placeholder={isBirthday ? "Nome do aniversariante" : "Novo lembrete"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => playSfx("drop")}
            required
          />
          {!isBirthday && (
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onFocus={() => playSfx("drop")}
              required
            />
          )}
          {isBirthday && (
            <input
              type="number"
              placeholder="Ano de nasc. (opcional)"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              onFocus={() => playSfx("drop")}
              min={1900}
              max={selectedDateObj.getFullYear()}
            />
          )}
          {!isBirthday && (
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReminderType)}
              onFocus={() => playSfx("drop")}
            >
              <option value="REUNIAO">Reunião</option>
              <option value="TAREFA">Tarefa</option>
              <option value="OUTRO">Evento</option>
            </select>
          )}
          {variant === "agenda" && (
            <label className="recurring-check">
              <input
                type="checkbox"
                checked={isBirthday}
                onChange={(e) => setIsBirthday(e.target.checked)}
              />
              🎂 Marcar como aniversário (avisa 20, 15, 10, 5 dias antes e na véspera, todo ano)
            </label>
          )}
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
