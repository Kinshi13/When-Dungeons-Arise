import { WALLET_KEY, type WalletBase } from "./api";
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { getSession } from "./auth";
import type { SyncStatus } from "./syncEngine";

// A Carteira é um valor único por conta (não uma lista), então não usa o
// motor genérico de syncTable (feito pra listas de itens com id próprio) —
// é só um upsert/leitura de uma linha só, chaveada pelo user_id.

interface RemoteWalletRow {
  user_id: string;
  base_amount: number;
  base_set_at: string;
  updated_at: string;
}

function loadLocalWallet(): WalletBase {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return { baseAmount: 0, baseSetAt: new Date(0).toISOString() };
    return JSON.parse(raw);
  } catch {
    return { baseAmount: 0, baseSetAt: new Date(0).toISOString() };
  }
}

function saveLocalWallet(wallet: WalletBase) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
}

export async function syncWalletNow(): Promise<SyncStatus> {
  if (!isSupabaseConfigured() || !supabase) return { status: "not-configured" };

  const session = await getSession();
  if (!session) return { status: "not-signed-in" };

  try {
    const userId = session.user.id;
    const local = loadLocalWallet();

    const { data: remote, error: fetchError } = await supabase
      .from("wallet")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<RemoteWalletRow>();
    if (fetchError) throw fetchError;

    const localUpdatedAt = local.updatedAt ?? new Date(0).toISOString();
    let pushed = 0;
    let pulled = 0;

    if (!remote || new Date(localUpdatedAt) > new Date(remote.updated_at)) {
      const { error: upsertError } = await supabase.from("wallet").upsert({
        user_id: userId,
        base_amount: local.baseAmount,
        base_set_at: local.baseSetAt,
        updated_at: localUpdatedAt,
      });
      if (upsertError) throw upsertError;
      pushed = 1;
    } else if (new Date(remote.updated_at) > new Date(localUpdatedAt)) {
      saveLocalWallet({
        baseAmount: remote.base_amount,
        baseSetAt: remote.base_set_at,
        updatedAt: remote.updated_at,
      });
      pulled = 1;
    }

    return { status: "ok", pushed, pulled };
  } catch (err) {
    console.warn("[syncWallet] falha ao sincronizar", err);
    return { status: "error" };
  }
}
