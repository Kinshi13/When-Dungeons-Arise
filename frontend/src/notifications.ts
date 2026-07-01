import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder, Bill } from "./api";
import type { Holiday } from "./game/holidays";
import type { PeriodComparison } from "./game/financeAnalysis";
import { loadNotificationPrefs } from "./notificationPrefs";

const BILL_ALERT_DAYS = [10, 5, 1];

export const isNativePlatform = () => Capacitor.isNativePlatform();

// Local notifications exigem um id numérico; derivamos um a partir do cuid do lembrete.
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 2147483647;
}

// Canais Android — um por tela, com um design simples e consistente (mesmo
// nome/ícone dourado do resto do app). Deixa o usuário também gerenciar cada
// categoria direto nas configurações de notificação do sistema, se quiser.
const NOTIFICATION_CHANNELS = [
  { id: "agenda", name: "Agenda", description: "Lembretes de eventos, reuniões e tarefas no horário marcado." },
  { id: "calendario", name: "Calendário", description: "Avisos de feriados próximos." },
  { id: "contas", name: "Contas & assinaturas", description: "Avisos de contas e assinaturas perto do vencimento." },
  { id: "financas", name: "Finanças", description: "Alertas de gastos acima do normal na semana ou no mês." },
] as const;

// Azul claro simples e discreto para o ícone de todas as notificações — lê
// bem tanto no modo claro quanto no escuro do Android, e é o mesmo tom usado
// no tema "Claro" do app, dando uma identidade visual simples e consistente
// independente da categoria.
const NOTIFICATION_ICON_COLOR = "#5fb3e0";

export async function setupNotificationChannels() {
  if (!isNativePlatform()) return;
  for (const channel of NOTIFICATION_CHANNELS) {
    await LocalNotifications.createChannel({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      importance: 4,
      visibility: 1,
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  const result = await LocalNotifications.requestPermissions();
  return result.display === "granted";
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  const result = await LocalNotifications.checkPermissions();
  return result.display === "granted";
}

export async function scheduleReminderNotification(reminder: Reminder) {
  if (!isNativePlatform() || !loadNotificationPrefs().agenda) return;
  const fireDate = new Date(reminder.dateTime);
  if (fireDate.getTime() <= Date.now()) return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: hashId(reminder.id),
        title: reminder.title,
        body: reminder.description || "Lembrete agendado",
        schedule: { at: fireDate },
        channelId: "agenda",
        iconColor: NOTIFICATION_ICON_COLOR,
      },
    ],
  });
}

export async function cancelReminderNotification(reminderId: string) {
  if (!isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: hashId(reminderId) }] });
}

export async function syncAllReminderNotifications(reminders: Reminder[]) {
  if (!isNativePlatform()) return;
  for (const reminder of reminders) {
    await cancelReminderNotification(reminder.id);
    await scheduleReminderNotification(reminder);
  }
}

function billAlertId(billId: string, daysBefore: number): number {
  return hashId(`bill:${billId}:${daysBefore}`);
}

export async function scheduleBillNotifications(bill: Bill) {
  if (!isNativePlatform()) return;
  await cancelBillNotifications(bill.id);
  if (!loadNotificationPrefs().contas || bill.status !== "PENDENTE") return;

  const due = new Date(bill.dueDate);
  const notifications = BILL_ALERT_DAYS.map((days) => {
    const fireDate = new Date(due);
    fireDate.setDate(fireDate.getDate() - days);
    fireDate.setHours(9, 0, 0, 0);
    return { days, fireDate };
  }).filter(({ fireDate }) => fireDate.getTime() > Date.now());

  if (notifications.length === 0) return;

  await LocalNotifications.schedule({
    notifications: notifications.map(({ days, fireDate }) => ({
      id: billAlertId(bill.id, days),
      title: `Conta vence em ${days} dia${days > 1 ? "s" : ""}`,
      body: `${bill.title} — R$ ${bill.amount.toFixed(2)}`,
      schedule: { at: fireDate },
      channelId: "contas",
      iconColor: NOTIFICATION_ICON_COLOR,
    })),
  });
}

export async function cancelBillNotifications(billId: string) {
  if (!isNativePlatform()) return;
  await LocalNotifications.cancel({
    notifications: BILL_ALERT_DAYS.map((days) => ({ id: billAlertId(billId, days) })),
  });
}

export async function syncAllBillNotifications(bills: Bill[]) {
  if (!isNativePlatform()) return;
  for (const bill of bills) {
    await scheduleBillNotifications(bill);
  }
}

function holidayAlertId(holiday: Holiday): number {
  return hashId(`holiday:${holiday.date}`);
}

// Um aviso simples na véspera de cada feriado nacional — a mesma lógica que
// já alimenta o resumo da Agenda (getBrazilianHolidays), só que virando
// notificação. Só agenda feriados ainda por vir, pra não acumular passado.
export async function scheduleHolidayNotification(holiday: Holiday) {
  if (!isNativePlatform()) return;
  await cancelHolidayNotification(holiday);
  if (!loadNotificationPrefs().calendario) return;

  const fireDate = new Date(`${holiday.date}T09:00:00`);
  fireDate.setDate(fireDate.getDate() - 1);
  if (fireDate.getTime() <= Date.now()) return;

  await LocalNotifications.schedule({
    notifications: [
      {
        id: holidayAlertId(holiday),
        title: "Feriado amanhã",
        body: holiday.name,
        schedule: { at: fireDate },
        channelId: "calendario",
        iconColor: NOTIFICATION_ICON_COLOR,
      },
    ],
  });
}

export async function cancelHolidayNotification(holiday: Holiday) {
  if (!isNativePlatform()) return;
  await LocalNotifications.cancel({ notifications: [{ id: holidayAlertId(holiday) }] });
}

export async function syncAllHolidayNotifications(holidays: Holiday[]) {
  if (!isNativePlatform()) return;
  for (const holiday of holidays) {
    await scheduleHolidayNotification(holiday);
  }
}

const OVERSPEND_STATE_KEY = "lembretes-app:overspend-notify-state";
const OVERSPEND_THRESHOLD_PCT = 30;

interface OverspendState {
  lastWeekAlertDate?: string;
  lastMonthAlertDate?: string;
}

function loadOverspendState(): OverspendState {
  try {
    const raw = localStorage.getItem(OVERSPEND_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverspendState(state: OverspendState) {
  localStorage.setItem(OVERSPEND_STATE_KEY, JSON.stringify(state));
}

// Dispara na hora (sem agendamento futuro) quando os gastos da semana ou do
// mês (até agora) ficam bem acima do mesmo ponto do período anterior — no
// máximo um aviso de cada por dia, pra não virar spam a cada gasto lançado.
export async function checkOverspendingAndNotify(week: PeriodComparison, month: PeriodComparison) {
  if (!isNativePlatform() || !loadNotificationPrefs().financas) return;

  const todayKey = new Date().toISOString().slice(0, 10);
  const state = loadOverspendState();
  const notifications: { id: number; title: string; body: string }[] = [];

  if (
    week.percentChange !== null &&
    week.percentChange >= OVERSPEND_THRESHOLD_PCT &&
    state.lastWeekAlertDate !== todayKey
  ) {
    notifications.push({
      id: hashId(`overspend:week:${todayKey}`),
      title: "Gastos da semana acima do normal",
      body: `Você já gastou ${Math.round(week.percentChange)}% a mais que na mesma parte da semana passada.`,
    });
    state.lastWeekAlertDate = todayKey;
  }

  if (
    month.percentChange !== null &&
    month.percentChange >= OVERSPEND_THRESHOLD_PCT &&
    state.lastMonthAlertDate !== todayKey
  ) {
    notifications.push({
      id: hashId(`overspend:month:${todayKey}`),
      title: "Gastos do mês acima do normal",
      body: `Você já gastou ${Math.round(month.percentChange)}% a mais que no mesmo ponto do mês passado.`,
    });
    state.lastMonthAlertDate = todayKey;
  }

  if (notifications.length === 0) return;
  await LocalNotifications.schedule({
    notifications: notifications.map((n) => ({ ...n, channelId: "financas", iconColor: NOTIFICATION_ICON_COLOR })),
  });
  saveOverspendState(state);
}
