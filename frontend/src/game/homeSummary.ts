import type { Bill, Reminder } from "../api";
import type { WeatherInfo } from "../weather";
import type { Alarm } from "../clockStore";
import { toDateKey } from "./calendarEntries";

export interface HomeHighlight {
  icon: string;
  text: string;
}

export interface HomeSummary {
  weather: HomeHighlight | null;
  alarm: HomeHighlight | null;
  // Item mais urgente entre lembretes, contas e aniversários — o próximo a
  // vencer/acontecer a partir de agora, sem duplicar o que já aparece nos
  // cards de Clima/Relógio.
  highlight: HomeHighlight | null;
}

function dayLabel(dateKey: string, todayKey: string, tomorrowKey: string): string {
  if (dateKey === todayKey) return "hoje";
  if (dateKey === tomorrowKey) return "amanhã";
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function nextBirthdayOccurrence(reminder: Reminder, now: Date): Date | null {
  const original = new Date(reminder.dateTime);
  for (const year of [now.getFullYear(), now.getFullYear() + 1]) {
    const occurrence = new Date(year, original.getMonth(), original.getDate());
    if (occurrence.getTime() >= new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
      return occurrence;
    }
  }
  return null;
}

// Resumo compacto pro card centralizado da Recepção: clima atual, próximo
// alarme e o compromisso mais urgente (lembrete, conta ou aniversário) —
// sempre o de data mais próxima a partir de agora, entre os três tipos.
export function buildHomeSummary(
  reminders: Reminder[],
  bills: Bill[],
  weather: WeatherInfo | null,
  alarm: Alarm | null
): HomeSummary {
  const now = new Date();
  const todayKey = toDateKey(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = toDateKey(tomorrow);

  const weatherHighlight: HomeHighlight | null = weather
    ? { icon: weather.emoji, text: `${weather.temperature}° · ${weather.description}` }
    : null;

  const alarmHighlight: HomeHighlight | null = alarm
    ? { icon: "⏰", text: alarm.label ? `${alarm.time} · ${alarm.label}` : `Alarme às ${alarm.time}` }
    : null;

  const candidates: { time: number; highlight: HomeHighlight }[] = [];

  for (const reminder of reminders) {
    if (reminder.done) continue;
    if (reminder.isBirthday) {
      const occurrence = nextBirthdayOccurrence(reminder, now);
      if (!occurrence) continue;
      const key = toDateKey(occurrence);
      candidates.push({
        time: occurrence.getTime(),
        highlight: { icon: "🎂", text: `Aniversário de ${reminder.title} ${dayLabel(key, todayKey, tomorrowKey)}` },
      });
      continue;
    }
    const dateTime = new Date(reminder.dateTime);
    if (dateTime.getTime() < now.getTime()) continue;
    const key = toDateKey(dateTime);
    const time = dateTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    candidates.push({
      time: dateTime.getTime(),
      highlight: { icon: "📌", text: `${reminder.title} · ${dayLabel(key, todayKey, tomorrowKey)} ${time}` },
    });
  }

  for (const bill of bills) {
    if (bill.status !== "PENDENTE") continue;
    const dueDate = new Date(bill.dueDate);
    const key = toDateKey(dueDate);
    if (key < todayKey) continue;
    candidates.push({
      time: dueDate.getTime(),
      highlight: { icon: "💰", text: `${bill.title} vence ${dayLabel(key, todayKey, tomorrowKey)}` },
    });
  }

  candidates.sort((a, b) => a.time - b.time);

  return {
    weather: weatherHighlight,
    alarm: alarmHighlight,
    highlight: candidates[0]?.highlight ?? null,
  };
}
