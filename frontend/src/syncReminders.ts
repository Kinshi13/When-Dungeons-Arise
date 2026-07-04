import type { Reminder } from "./api";
import { syncTable, type SyncStatus } from "./syncEngine";
import { syncAllReminderNotifications, syncAllBirthdayNotifications } from "./notifications";
import { syncReminderWidget } from "./widgetBridge";

interface RemoteReminderRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date_time: string;
  type: string;
  priority: string;
  done: boolean;
  from_note: boolean;
  is_birthday: boolean;
  birth_year: number | null;
  deleted: boolean;
  updated_at: string;
}

function toRemote(r: Reminder, userId: string): RemoteReminderRow {
  return {
    id: r.id,
    user_id: userId,
    title: r.title,
    description: r.description ?? null,
    date_time: r.dateTime,
    type: r.type,
    priority: r.priority,
    done: !!r.done,
    from_note: !!r.fromNote,
    is_birthday: !!r.isBirthday,
    birth_year: r.birthYear ?? null,
    deleted: !!r.deleted,
    updated_at: r.updatedAt ?? new Date(0).toISOString(),
  };
}

function fromRemote(row: RemoteReminderRow): Reminder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dateTime: row.date_time,
    type: row.type as Reminder["type"],
    priority: row.priority as Reminder["priority"],
    done: row.done,
    fromNote: row.from_note,
    isBirthday: row.is_birthday,
    birthYear: row.birth_year,
    deleted: row.deleted,
    updatedAt: row.updated_at,
  };
}

export async function syncRemindersNow(): Promise<SyncStatus> {
  return syncTable<Reminder, RemoteReminderRow>({
    localTableName: "reminders",
    remoteTableName: "reminders",
    toRemote,
    fromRemote,
    afterPull: async (fresh) => {
      await syncAllReminderNotifications(fresh);
      await syncAllBirthdayNotifications(fresh);
      await syncReminderWidget(fresh);
    },
  });
}
