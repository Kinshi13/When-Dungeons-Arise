import { syncRemindersNow } from "./syncReminders";
import { syncNotesNow } from "./syncNotes";
import { syncExpensesNow } from "./syncExpenses";
import { syncBillsNow } from "./syncBills";
import { syncWalletNow } from "./syncWallet";
import { syncAlarmsNow } from "./syncAlarms";
import { markSynced, type SyncStatus } from "./syncEngine";

export interface SyncAllResult {
  status: SyncStatus["status"];
  pushed: number;
  pulled: number;
}

// Sincroniza todos os tipos de dado da Fase 2, um de cada vez (mais simples
// de acompanhar que em paralelo, e o volume de uma agenda/finanças pessoal
// não justifica a complexidade de paralelizar). Usado no boot do app, no
// timer periódico e no botão "Sincronizar agora" das Configurações.
export async function syncAllNow(): Promise<SyncAllResult> {
  const results = await Promise.all([
    syncRemindersNow(),
    syncNotesNow(),
    syncExpensesNow(),
    syncBillsNow(),
    syncWalletNow(),
    syncAlarmsNow(),
  ]);

  if (results.every((r) => r.status === "not-configured")) return { status: "not-configured", pushed: 0, pulled: 0 };
  if (results.some((r) => r.status === "not-signed-in")) return { status: "not-signed-in", pushed: 0, pulled: 0 };

  const ok = results.filter((r) => r.status === "ok") as Extract<SyncStatus, { status: "ok" }>[];
  const pushed = ok.reduce((sum, r) => sum + r.pushed, 0);
  const pulled = ok.reduce((sum, r) => sum + r.pulled, 0);
  const status = results.some((r) => r.status === "error") ? "error" : "ok";

  if (status === "ok") markSynced();
  return { status, pushed, pulled };
}
