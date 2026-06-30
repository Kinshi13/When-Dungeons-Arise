import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Reminder, Bill } from "./api";

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
  if (!isNativePlatform()) return;
  const fireDate = new Date(reminder.dateTime);
  if (fireDate.getTime() <= Date.now()) return;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: hashId(reminder.id),
        title: reminder.title,
        body: reminder.description || "Lembrete agendado",
        schedule: { at: fireDate },
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
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({
      notifications: pending.notifications.map((n) => ({ id: n.id })),
    });
  }
  for (const reminder of reminders) {
    await scheduleReminderNotification(reminder);
  }
}

function billAlertId(billId: string, daysBefore: number): number {
  return hashId(`bill:${billId}:${daysBefore}`);
}

export async function scheduleBillNotifications(bill: Bill) {
  if (!isNativePlatform()) return;
  await cancelBillNotifications(bill.id);
  if (bill.paid) return;

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
