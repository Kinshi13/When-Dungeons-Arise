import type { RawSystemNotification } from "./notificationBridge";
import { findDateMention } from "./game/dateDetector";

export interface NotificationGroup {
  packageName: string;
  appName: string;
  items: RawSystemNotification[];
}

// Agrupa por app de origem (mais recente primeiro, tanto os grupos quanto os
// itens dentro de cada grupo).
export function groupNotifications(items: RawSystemNotification[]): NotificationGroup[] {
  const map = new Map<string, NotificationGroup>();
  for (const item of items) {
    const existing = map.get(item.packageName);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(item.packageName, { packageName: item.packageName, appName: item.appName, items: [item] });
    }
  }

  const groups = [...map.values()];
  for (const group of groups) {
    group.items.sort((a, b) => b.postTime - a.postTime);
  }
  groups.sort((a, b) => (b.items[0]?.postTime ?? 0) - (a.items[0]?.postTime ?? 0));
  return groups;
}

// Notificações com uma data mencionada no texto ganham a opção de virar missão
// no mural, igual já acontece com notas do Diário.
export function hasScheduleHint(notification: RawSystemNotification): boolean {
  return !!findDateMention(`${notification.title} ${notification.text}`);
}
