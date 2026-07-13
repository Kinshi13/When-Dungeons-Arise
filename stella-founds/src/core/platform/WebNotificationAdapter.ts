import type { NotificationAdapter, ScheduleReminderInput } from './NotificationAdapter';

const MAX_DELAY_MS = 24 * 60 * 60 * 1000;

/**
 * Browser Notification API has no real background scheduler — a timer only
 * fires while this tab stays open. Reminders further out than MAX_DELAY_MS
 * are silently skipped rather than faking a guarantee we can't keep. Native
 * builds should swap this for a Capacitor LocalNotifications adapter, which
 * schedules at the OS level.
 */
export class WebNotificationAdapter implements NotificationAdapter {
  private readonly timers = new Map<string, number>();

  async requestPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  async scheduleReminder(input: ScheduleReminderInput): Promise<void> {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    this.cancelTimer(input.id);
    const delay = new Date(input.at).getTime() - Date.now();
    if (delay < 0 || delay > MAX_DELAY_MS) return;

    const timerId = window.setTimeout(() => {
      new Notification(input.title, { body: input.body });
      this.timers.delete(input.id);
    }, delay);
    this.timers.set(input.id, timerId);
  }

  async cancelReminder(id: string): Promise<void> {
    this.cancelTimer(id);
  }

  private cancelTimer(id: string): void {
    const timerId = this.timers.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.timers.delete(id);
    }
  }
}
