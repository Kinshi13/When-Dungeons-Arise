import { table } from "./core/repositories/storage";

export interface MonitoredApp {
  id: string; // packageName
  packageName: string;
  appName: string;
  enabled: boolean; // monitorar notificações desse app no gerenciador do Mural
  priority: boolean; // prioridade alta (bancos e afins)
  autoExpense: boolean; // detectar compra/gasto no texto e lançar direto nas finanças
}

const monitoredAppTable = table<MonitoredApp>("monitored-apps");

// Bancos e carteiras comuns no Brasil — já entram sugeridos com prioridade alta
// e detecção automática de gasto ligadas, prontos pra ativar quando o acesso a
// notificações for testado num aparelho de verdade. O usuário pode desmarcar,
// ajustar ou adicionar outros apps na tela de Ajustes.
const DEFAULT_BANK_APPS: Omit<MonitoredApp, "enabled">[] = [
  { id: "com.nu.production", packageName: "com.nu.production", appName: "Nubank", priority: true, autoExpense: true },
  { id: "com.itau", packageName: "com.itau", appName: "Itaú", priority: true, autoExpense: true },
  { id: "com.bb.android", packageName: "com.bb.android", appName: "Banco do Brasil", priority: true, autoExpense: true },
  { id: "com.bradesco", packageName: "com.bradesco", appName: "Bradesco", priority: true, autoExpense: true },
  { id: "com.caixa.gov.br", packageName: "com.caixa.gov.br", appName: "Caixa", priority: true, autoExpense: true },
  { id: "br.com.intermedium", packageName: "br.com.intermedium", appName: "Banco Inter", priority: true, autoExpense: true },
  { id: "com.picpay", packageName: "com.picpay", appName: "PicPay", priority: true, autoExpense: true },
  { id: "com.mercadopago.wallet", packageName: "com.mercadopago.wallet", appName: "Mercado Pago", priority: true, autoExpense: true },
];

function ensureSeeded() {
  if (monitoredAppTable.list().length > 0) return;
  monitoredAppTable.save(DEFAULT_BANK_APPS.map((app) => ({ ...app, enabled: false })));
}

export function listMonitoredApps(): MonitoredApp[] {
  ensureSeeded();
  return [...monitoredAppTable.list()].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority ? -1 : 1;
    return a.appName.localeCompare(b.appName);
  });
}

export function upsertMonitoredApp(patch: Partial<MonitoredApp> & { packageName: string; appName: string }) {
  const existing = monitoredAppTable.get(patch.packageName);
  if (existing) {
    monitoredAppTable.update(patch.packageName, patch);
  } else {
    monitoredAppTable.insert({
      id: patch.packageName,
      packageName: patch.packageName,
      appName: patch.appName,
      enabled: patch.enabled ?? false,
      priority: patch.priority ?? false,
      autoExpense: patch.autoExpense ?? false,
    });
  }
}

export function removeMonitoredApp(packageName: string) {
  monitoredAppTable.remove(packageName);
}

// Garante que todo app que já mandou notificação apareça na lista de Ajustes
// (mesmo sem monitoramento ligado ainda), pra dar pra escolher/priorizar.
export function ensureAppsKnown(apps: { packageName: string; appName: string }[]) {
  ensureSeeded();
  const known = new Set(monitoredAppTable.list().map((a) => a.packageName));
  for (const app of apps) {
    if (!known.has(app.packageName)) {
      monitoredAppTable.insert({
        id: app.packageName,
        packageName: app.packageName,
        appName: app.appName,
        enabled: false,
        priority: false,
        autoExpense: false,
      });
      known.add(app.packageName);
    }
  }
}
