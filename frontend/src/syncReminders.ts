import { table } from "./storage";
import type { Reminder } from "./api";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getSession } from "./auth";
import { syncAllReminderNotifications, syncAllBirthdayNotifications } from "./notifications";
import { syncReminderWidget } from "./widgetBridge";

// Fase 1 da sincronização entre aparelhos: só Lembretes, como prova de
// conceito (ver supabase/schema.sql). Reabre a MESMA tabela local que
// api.ts usa (table() não guarda estado em memória — só lê/escreve o
// localStorage na hora — então isso não duplica nem desincroniza nada).
const reminderTable = table<Reminder>("reminders");

const LAST_SYNC_KEY = "lembretes-app:last-sync";

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

function localToRemote(r: Reminder, userId: string): RemoteReminderRow {
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

function remoteToLocal(row: RemoteReminderRow): Reminder {
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

export type SyncResult =
  | { status: "ok"; pushed: number; pulled: number }
  | { status: "not-configured" | "not-signed-in" | "error" };

let syncing = false;

// Sincronização simples "quem mudou por último, vence" (comparando
// updatedAt) — sem CRDT nem resolução de conflito sofisticada, porque não é
// esperado editar o mesmo lembrete nos dois aparelhos ao mesmo tempo. Busca
// TODAS as linhas do usuário a cada chamada (sem cursor incremental) — bom o
// bastante pro volume de uma agenda pessoal; otimizar com um cursor por
// updated_at fica pra quando/se o volume justificar.
export async function syncRemindersNow(): Promise<SyncResult> {
  if (!isSupabaseConfigured() || !supabase) return { status: "not-configured" };
  if (syncing) return { status: "error" };

  const session = await getSession();
  if (!session) return { status: "not-signed-in" };

  syncing = true;
  try {
    const userId = session.user.id;
    const local = reminderTable.list();

    const { data: remoteRows, error: fetchError } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", userId);
    if (fetchError) throw fetchError;

    const remoteById = new Map<string, RemoteReminderRow>((remoteRows ?? []).map((row) => [row.id, row as RemoteReminderRow]));
    const localById = new Map(local.map((r) => [r.id, r]));

    const toPush: RemoteReminderRow[] = [];
    for (const r of local) {
      const remote = remoteById.get(r.id);
      const localUpdatedAt = r.updatedAt ?? new Date(0).toISOString();
      if (!remote || new Date(localUpdatedAt) > new Date(remote.updated_at)) {
        toPush.push(localToRemote(r, userId));
      }
    }
    if (toPush.length > 0) {
      const { error: upsertError } = await supabase.from("reminders").upsert(toPush);
      if (upsertError) throw upsertError;
    }

    let pulled = 0;
    for (const row of remoteById.values()) {
      const localItem = localById.get(row.id);
      const localUpdatedAt = localItem?.updatedAt;
      if (!localItem || new Date(row.updated_at) > new Date(localUpdatedAt ?? 0)) {
        const merged = remoteToLocal(row);
        if (localItem) reminderTable.update(row.id, merged);
        else reminderTable.insert(merged);
        pulled++;
      }
    }

    if (pulled > 0) {
      const fresh = reminderTable.list().filter((r) => !r.deleted);
      await syncAllReminderNotifications(fresh);
      await syncAllBirthdayNotifications(fresh);
      await syncReminderWidget(fresh);
    }

    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    return { status: "ok", pushed: toPush.length, pulled };
  } catch (err) {
    console.warn("[syncReminders] falha ao sincronizar", err);
    return { status: "error" };
  } finally {
    syncing = false;
  }
}

export function getLastSyncedAt(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}
