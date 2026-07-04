import type { Expense } from "./api";
import { syncTable, type SyncStatus } from "./syncEngine";

interface RemoteExpenseRow {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  date: string;
  installment_group_id: string | null;
  installment_index: number | null;
  installment_total: number | null;
  superficial: boolean;
  deleted: boolean;
  updated_at: string;
}

function toRemote(e: Expense, userId: string): RemoteExpenseRow {
  return {
    id: e.id,
    user_id: userId,
    amount: e.amount,
    description: e.description ?? null,
    date: e.date,
    installment_group_id: e.installmentGroupId ?? null,
    installment_index: e.installmentIndex ?? null,
    installment_total: e.installmentTotal ?? null,
    superficial: !!e.superficial,
    deleted: !!e.deleted,
    updated_at: e.updatedAt ?? new Date(0).toISOString(),
  };
}

function fromRemote(row: RemoteExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    description: row.description,
    date: row.date,
    installmentGroupId: row.installment_group_id,
    installmentIndex: row.installment_index,
    installmentTotal: row.installment_total,
    superficial: row.superficial,
    deleted: row.deleted,
    updatedAt: row.updated_at,
  };
}

// DailySummary (Finanças/Análises) é recalculada na hora a partir das
// despesas ativas (ver computeDailySummaries em api.ts) — puxar despesas
// novas aqui já é suficiente, não precisa de nenhum afterPull.
export async function syncExpensesNow(): Promise<SyncStatus> {
  return syncTable<Expense, RemoteExpenseRow>({
    localTableName: "expenses",
    remoteTableName: "expenses",
    toRemote,
    fromRemote,
  });
}
