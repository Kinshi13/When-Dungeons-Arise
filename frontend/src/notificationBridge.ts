import { registerPlugin } from "@capacitor/core";
import { isNativePlatform } from "./notifications";

export interface RawSystemNotification {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  postTime: number; // epoch ms
}

interface NotificationBridgePluginApi {
  isAccessGranted(): Promise<{ granted: boolean }>;
  openAccessSettings(): Promise<void>;
  getRecentNotifications(): Promise<{ items: RawSystemNotification[] }>;
  setMonitoredPackages(options: { packages: string[] }): Promise<void>;
}

// Ponte pro plugin nativo Android (AppNotificationListenerService +
// NotificationBridgePlugin, em android/app/.../com/stellafounds/app). Não existe
// implementação web — fora do Android nativo caímos sempre nos dados de
// exemplo abaixo.
const NotificationBridge = registerPlugin<NotificationBridgePluginApi>("NotificationBridge");

const now = Date.now();
const HOUR = 3600_000;

// Dados de exemplo — usados sempre que não há acesso real (navegador, ou
// enquanto o acesso a notificações não foi ligado num aparelho Android de
// verdade). Servem pra já desenhar e testar o agrupamento e a tela.
const MOCK_NOTIFICATIONS: RawSystemNotification[] = [
  {
    id: "mock-1",
    packageName: "com.whatsapp",
    appName: "WhatsApp",
    title: "Grupo da Família",
    text: "Fulano: bora marcar o almoço de domingo, dia 12/07?",
    postTime: now - HOUR * 1,
  },
  {
    id: "mock-2",
    packageName: "com.whatsapp",
    appName: "WhatsApp",
    title: "Beltrana",
    text: "Confirmado pra reunião amanhã 14h",
    postTime: now - HOUR * 3,
  },
  {
    id: "mock-3",
    packageName: "com.google.android.gm",
    appName: "Gmail",
    title: "Fatura do cartão disponível",
    text: "Sua fatura de julho já está disponível. Vencimento em 15/07.",
    postTime: now - HOUR * 5,
  },
  {
    id: "mock-4",
    packageName: "com.google.android.calendar",
    appName: "Agenda",
    title: "Consulta médica",
    text: "Lembrete: consulta às 10h de amanhã",
    postTime: now - HOUR * 20,
  },
  {
    id: "mock-5",
    packageName: "com.google.android.gm",
    appName: "Gmail",
    title: "Pedido enviado",
    text: "Seu pedido saiu pra entrega, chega até 20/07",
    postTime: now - HOUR * 30,
  },
  {
    id: "mock-6",
    packageName: "com.nu.production",
    appName: "Nubank",
    title: "Compra aprovada",
    text: "Compra de R$ 89,90 aprovada no cartão em Mercado Bom Preço",
    postTime: now - HOUR * 2,
  },
];

export async function isNotificationAccessGranted(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const { granted } = await NotificationBridge.isAccessGranted();
    return granted;
  } catch {
    return false;
  }
}

export async function openNotificationAccessSettings(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await NotificationBridge.openAccessSettings();
  } catch {
    // Plugin nativo ainda não testado num aparelho real nesta build — ignora.
  }
}

export async function fetchRecentNotifications(): Promise<{
  items: RawSystemNotification[];
  isExample: boolean;
}> {
  if (isNativePlatform()) {
    try {
      const { items } = await NotificationBridge.getRecentNotifications();
      if (items.length > 0) return { items, isExample: false };
    } catch {
      // cai no exemplo abaixo
    }
  }
  return { items: MOCK_NOTIFICATIONS, isExample: true };
}

// Avisa o serviço nativo quais apps o usuário liberou pra guardar o conteúdo
// (título/texto) das notificações — todo o resto continua só com nome/pacote,
// sem nenhum texto guardado. Chamado sempre que a lista de apps monitorados
// muda em Ajustes, e ao abrir a tela de gerenciamento.
export async function syncMonitoredPackages(packageNames: string[]): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await NotificationBridge.setMonitoredPackages({ packages: packageNames });
  } catch {
    // Plugin nativo ainda não testado num aparelho real nesta build — ignora.
  }
}
