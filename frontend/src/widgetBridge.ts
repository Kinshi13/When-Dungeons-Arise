import { registerPlugin } from "@capacitor/core";
import { isNativePlatform } from "./notifications";
import type { Reminder } from "./api";

interface WidgetItem {
  title: string;
  time: string;
}

interface WidgetBridgePluginApi {
  syncReminders(options: { items: WidgetItem[] }): Promise<void>;
}

// Ponte pro widget nativo de Lembretes (ReminderWidgetProvider, em
// android/app/.../com/lembretes/app). O widget roda fora do WebView — não
// tem acesso ao localStorage, então toda vez que a lista de lembretes muda
// mandamos um resumo pronto (só o que cabe na tela do widget) pra ele
// guardar em SharedPreferences nativo e se redesenhar.
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
