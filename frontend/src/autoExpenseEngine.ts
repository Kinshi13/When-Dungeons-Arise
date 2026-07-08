import { table } from "./core/repositories/storage";
import { api } from "./api";
import type { RawSystemNotification } from "./notificationBridge";
import { findExpenseMention } from "./expenseDetector";
import { listMonitoredApps, type MonitoredApp } from "./notificationAppPrefs";

interface ProcessedMarker {
  id: string;
}

const processedTable = table<ProcessedMarker>("processed-expense-notifications");

export interface AutoExpenseResult {
  notificationId: string;
  amount: number;
}

// Roda sempre que a tela de notificações atualiza a lista — detecta gastos em
// notificações de apps com "autoExpense" ligado (Ajustes > Notificações
// monitoradas) e lança automaticamente nas finanças, marcando a notificação
// como processada pra não duplicar o lançamento numa atualização seguinte.
// O plugin nativo ainda funciona no modelo "pull" (sem push em tempo real),
// então por enquanto é aqui — na atualização da tela — que a automação roda.
export async function runAutoExpenseDetection(items: RawSystemNotification[]): Promise<AutoExpenseResult[]> {
  const appsByPackage = new Map<string, MonitoredApp>(listMonitoredApps().map((a) => [a.packageName, a]));
  const processedIds = new Set(processedTable.list().map((p) => p.id));
  const results: AutoExpenseResult[] = [];

  for (const item of items) {
    if (processedIds.has(item.id)) continue;
    const app = appsByPackage.get(item.packageName);
    if (!app || !app.enabled || !app.autoExpense) continue;

    const detected = findExpenseMention(`${item.title} ${item.text}`);
    if (!detected) continue;

    await api.expenses.create({
      amount: detected.amount,
      description: `${app.appName}: ${item.title || item.text}`.slice(0, 120),
      date: new Date(item.postTime).toISOString(),
    });
    processedTable.insert({ id: item.id });
    results.push({ notificationId: item.id, amount: detected.amount });
  }

  return results;
}

export function isNotificationProcessed(id: string): boolean {
  return processedTable.get(id) !== undefined;
}
