import type { Alarm } from "./clockStore";
import { syncTable, type SyncStatus } from "./syncEngine";
import { scheduleAlarmNotification, cancelAlarmNotification } from "./notifications";

interface RemoteAlarmRow {
  id: string;
  user_id: string;
  time: string;
  label: string | null;
  enabled: boolean;
  last_handled_date: string | null;
  deleted: boolean;
  updated_at: string;
}

function toRemote(a: Alarm, userId: string): RemoteAlarmRow {
  return {
    id: a.id,
    user_id: userId,
    time: a.time,
    label: a.label ?? null,
    enabled: !!a.enabled,
    last_handled_date: a.lastHandledDate ?? null,
    deleted: !!a.deleted,
    updated_at: a.updatedAt ?? new Date(0).toISOString(),
  };
}

function fromRemote(row: RemoteAlarmRow): Alarm {
  return {
    id: row.id,
    time: row.time,
    label: row.label ?? undefined,
    enabled: row.enabled,
    lastHandledDate: row.last_handled_date,
    deleted: row.deleted,
    updatedAt: row.updated_at,
  };
}

export async function syncAlarmsNow(): Promise<SyncStatus> {
  return syncTable<Alarm, RemoteAlarmRow>({
    localTableName: "alarms",
    remoteTableName: "alarms",
    toRemote,
    fromRemote,
    afterPull: async (fresh) => {
      for (const alarm of fresh) {
        if (alarm.enabled) await scheduleAlarmNotification(alarm.id, alarm.time, alarm.label);
        else await cancelAlarmNotification(alarm.id);
      }
    },
  });
}
