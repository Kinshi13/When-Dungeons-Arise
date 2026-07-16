export interface ScheduleReminderInput {
  id: string;
  title: string;
  body: string;
  /** ISO datetime the reminder should fire at. */
  at: string;
}

export interface NotificationAdapter {
  requestPermission(): Promise<boolean>;
  scheduleReminder(input: ScheduleReminderInput): Promise<void>;
  cancelReminder(id: string): Promise<void>;
}
