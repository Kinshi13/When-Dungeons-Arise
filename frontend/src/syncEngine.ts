import { table } from "./storage";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getSession } from "./auth";

// Motor genérico de sincronização (Fase 2) — a mesma lógica "quem mudou por
// último, vence" (comparando updatedAt) que validamos na Fase 1 com os
// Lembretes, só que parametrizada por tabela em vez de copiada pra cada
// tipo de dado. Cada domínio (notas, contas, despesas, alarmes...) só
// declara como converter pros dois formatos (local <-> remoto) e chama
// syncTable — ver syncReminders.ts pro exemplo mais simples.

export interface SyncableRecord {
  id: string;
  updatedAt?: string;
  deleted?: boolean;
}

export type SyncStatus =
  | { status: "ok"; pushed: number; pulled: number }
  | { status: "not-configured" | "not-signed-in" | "error" };

export interface SyncTableConfig<TLocal extends SyncableRecord, TRemote extends { id: string; updated_at: string }> {
  // Chave usada pelo table() do storage.ts (localStorage).
  localTableName: string;
  // Nome da tabela no Postgres/Supabase.
  remoteTableName: string;
  toRemote: (item: TLocal, userId: string) => TRemote;
  fromRemote: (row: TRemote) => TLocal;
  // Chamado só quando algo foi puxado de verdade — pra recalcular
  // notificações/widgets que dependem desses dados, sem fazer esse trabalho
  // à toa em toda sincronização (a maioria não traz nada novo pra puxar).
  afterPull?: (activeItems: TLocal[]) => void | Promise<void>;
}

const syncLocks = new Set<string>();

export async function syncTable<TLocal extends SyncableRecord, TRemote extends { id: string; updated_at: string }>(
  config: SyncTableConfig<TLocal, TRemote>
): Promise<SyncStatus> {
  if (!isSupabaseConfigured() || !supabase) return { status: "not-configured" };
  if (syncLocks.has(config.localTableName)) return { status: "error" };

  const session = await getSession();
  if (!session) return { status: "not-signed-in" };

  syncLocks.add(config.localTableName);
  try {
    const userId = session.user.id;
    const localTable = table<TLocal>(config.localTableName);
    const local = localTable.list();

    const { data: remoteRows, error: fetchError } = await supabase
      .from(config.remoteTableName)
      .select("*")
      .eq("user_id", userId);
    if (fetchError) throw fetchError;

    const remoteById = new Map<string, TRemote>((remoteRows ?? []).map((row) => [row.id, row as TRemote]));
    const localById = new Map(local.map((item) => [item.id, item]));

    const toPush: TRemote[] = [];
    for (const item of local) {
      const remote = remoteById.get(item.id);
      const localUpdatedAt = item.updatedAt ?? new Date(0).toISOString();
      if (!remote || new Date(localUpdatedAt) > new Date(remote.updated_at)) {
        toPush.push(config.toRemote(item, userId));
      }
    }
    if (toPush.length > 0) {
      const { error: upsertError } = await supabase.from(config.remoteTableName).upsert(toPush);
      if (upsertError) throw upsertError;
    }

    let pulled = 0;
    for (const row of remoteById.values()) {
      const localItem = localById.get(row.id);
      const localUpdatedAt = localItem?.updatedAt;
      if (!localItem || new Date(row.updated_at) > new Date(localUpdatedAt ?? 0)) {
        const merged = config.fromRemote(row);
        if (localItem) localTable.update(row.id, merged);
        else localTable.insert(merged);
        pulled++;
      }
    }

    if (pulled > 0 && config.afterPull) {
      const fresh = localTable.list().filter((item) => !item.deleted);
      await config.afterPull(fresh);
    }

    return { status: "ok", pushed: toPush.length, pulled };
  } catch (err) {
    console.warn(`[syncEngine] falha ao sincronizar ${config.remoteTableName}`, err);
    return { status: "error" };
  } finally {
    syncLocks.delete(config.localTableName);
  }
}

const LAST_SYNC_KEY = "lembretes-app:last-sync";

export function getLastSyncedAt(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function markSynced() {
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
}
