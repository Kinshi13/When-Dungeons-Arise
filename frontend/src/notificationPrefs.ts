// Preferência de notificações por tela — permite ao usuário escolher, por
// exemplo, receber só as da Agenda e nada de Finanças/Contas.
export type NotificationScreen = "agenda" | "calendario" | "contas" | "financas";

export interface NotificationPrefs {
  agenda: boolean;
  calendario: boolean;
  contas: boolean;
  financas: boolean;
}

const STORAGE_KEY = "lembretes-app:notification-prefs";

const DEFAULT_PREFS: NotificationPrefs = {
  agenda: true,
  calendario: true,
  contas: true,
  financas: true,
};

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export const NOTIFICATION_SCREEN_LABEL: Record<NotificationScreen, string> = {
  agenda: "Agenda",
  calendario: "Calendário (feriados)",
  contas: "Contas & assinaturas",
  financas: "Finanças (alerta de gastos)",
};

export const NOTIFICATION_SCREEN_HINT: Record<NotificationScreen, string> = {
  agenda: "Avisa no horário marcado de cada evento, reunião ou tarefa, e 20/15/10/5 dias e véspera de aniversários.",
  calendario: "Avisa na véspera dos feriados nacionais.",
  contas: "Avisa 10, 5 e 1 dia antes do vencimento de contas e assinaturas.",
  financas: "Avisa quando os gastos da semana ou do mês ficarem bem acima do normal.",
};
