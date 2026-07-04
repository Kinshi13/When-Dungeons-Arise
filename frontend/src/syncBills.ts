import type { Bill } from "./api";
import { syncTable, type SyncStatus } from "./syncEngine";
import { syncAllBillNotifications } from "./notifications";

interface RemoteBillRow {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_date: string;
  type: string;
  kind: string;
  status: string;
  priority: boolean;
  paid_date: string | null;
  recurring: boolean;
  recurrence_id: string | null;
  deleted: boolean;
  updated_at: string;
}

function toRemote(b: Bill, userId: string): RemoteBillRow {
  return {
    id: b.id,
    user_id: userId,
    title: b.title,
    amount: b.amount,
    due_date: b.dueDate,
    type: b.type,
    kind: b.kind,
    status: b.status,
    priority: !!b.priority,
    paid_date: b.paidDate ?? null,
    recurring: !!b.recurring,
    recurrence_id: b.recurrenceId ?? null,
    deleted: !!b.deleted,
    updated_at: b.updatedAt ?? new Date(0).toISOString(),
  };
}

function fromRemote(row: RemoteBillRow): Bill {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    dueDate: row.due_date,
    type: row.type as Bill["type"],
    kind: row.kind as Bill["kind"],
    status: row.status as Bill["status"],
    priority: row.priority,
    paidDate: row.paid_date,
    recurring: row.recurring,
    recurrenceId: row.recurrence_id,
    deleted: row.deleted,
    updatedAt: row.updated_at,
  };
}

export async function syncBillsNow(): Promise<SyncStatus> {
  return syncTable<Bill, RemoteBillRow>({
    localTableName: "bills",
    remoteTableName: "bills",
    toRemote,
    fromRemote,
    afterPull: async (fresh) => {
      await syncAllBillNotifications(fresh);
    },
  });
}
