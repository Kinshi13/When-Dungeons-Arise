import { registerPlugin } from "@capacitor/core";
import { isNativePlatform } from "./notifications";
import type { Reminder, Bill } from "./api";
import { buildCalendarEntries, toDateKey } from "./game/calendarEntries";
import { getBrazilianHolidays } from "./game/holidays";

interface WidgetItem {
  title: string;
  time: string;
}

interface CalendarWidgetCell {
  day: number | null;
  hasEvents: boolean;
  isToday: boolean;
}

interface WidgetBridgePluginApi {
  syncReminders(options: { items: WidgetItem[] }): Promise<void>;
  syncCalendar(options: { monthLabel: string; cells: CalendarWidgetCell[] }): Promise<void>;
}

// Ponte pro widgets nativos (ReminderWidgetProvider e CalendarWidgetProvider,
// em android/app/.../com/lembretes/app). Os widgets rodam fora do WebView —
// não têm acesso ao localStorage, então toda vez que os dados mudam mandamos
// um resumo pronto (só o que cabe na tela do widget) pra guardar em
// SharedPreferences nativo e se redesenhar.
const WidgetBridge = registerPlugin<WidgetBridgePluginApi>("WidgetBridge");

const MAX_WIDGET_ITEMS = 5;

function formatReminderTime(dateTime: string): string {
  const date = new Date(dateTime);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (date.toDateString() === now.toDateString()) return `Hoje ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) return `Amanhã ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${time}`;
}

// Chamado sempre que a lista de lembretes muda (criar/editar/concluir/
// excluir) e uma vez ao abrir o app — mantém o widget sempre com o retrato
// mais recente possível, dentro do que dá pra fazer sem o app estar aberto.
export async function syncReminderWidget(reminders: Reminder[]) {
  if (!isNativePlatform()) return;
  const graceMs = 5 * 60 * 1000; // mostra por mais 5min um lembrete que acabou de passar
  const upcoming = reminders
    .filter((r) => !r.done && new Date(r.dateTime).getTime() >= Date.now() - graceMs)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
    .slice(0, MAX_WIDGET_ITEMS)
    .map((r) => ({ title: r.title, time: formatReminderTime(r.dateTime) }));

  try {
    await WidgetBridge.syncReminders({ items: upcoming });
  } catch {
    // O widget é um bônus — se a ponte falhar, não deve derrubar o resto do app.
  }
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Chamado sempre que lembretes ou contas mudam, e uma vez ao abrir o app —
// monta o mini calendário do mês atual (mesma fonte de dados da tela de
// Calendário: lembretes + contas + feriados) pro widget nativo desenhar.
export async function syncCalendarWidget(reminders: Reminder[], bills: Bill[]) {
  if (!isNativePlatform()) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const holidays = getBrazilianHolidays(year);
  const entries = buildCalendarEntries(reminders, bills, holidays);
  const todayKey = toDateKey(now);
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarWidgetCell[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ day: null, hasEvents: false, isToday: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const key = toDateKey(new Date(year, month, day));
    cells.push({
      day,
      hasEvents: (entries.get(key)?.length ?? 0) > 0,
      isToday: key === todayKey,
    });
  }
  while (cells.length < 42) {
    cells.push({ day: null, hasEvents: false, isToday: false });
  }

  try {
    await WidgetBridge.syncCalendar({ monthLabel: `${MONTH_NAMES[month]} ${year}`, cells });
  } catch {
    // O widget é um bônus — se a ponte falhar, não deve derrubar o resto do app.
  }
}
