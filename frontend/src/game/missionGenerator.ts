import type { Reminder, ReminderType } from "../api";
import type { MissionCategory } from "../components/game/PixelMissionCard";
import { REWARDS, type RewardKey } from "./rewardService";

export interface Mission {
  id: string;
  reminderId: string;
  title: string;
  dueLabel: string;
  category: MissionCategory;
  rewardKey: RewardKey;
  rewardXp: number;
  rewardCoins: number;
  done: boolean;
}

const TYPE_TO_REWARD_KEY: Record<ReminderType, RewardKey> = {
  OUTRO: "taskSimples",
  TAREFA: "taskMedia",
  REUNIAO: "taskImportante",
};

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function categoryFor(reminder: Reminder, days: number): MissionCategory {
  if (reminder.type === "REUNIAO") return "especial";
  if (days <= 0) return "diaria";
  if (days <= 7) return "semanal";
  return "especial";
}

function dueLabelFor(days: number): string {
  if (days < 0) return `Atrasada há ${Math.abs(days)} dia(s)`;
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `Vence em ${days} dias`;
}

export function generateMissions(reminders: Reminder[]): {
  daily: Mission[];
  weekly: Mission[];
  special: Mission[];
} {
  const missions: Mission[] = reminders.map((r) => {
    const days = daysUntil(r.dateTime);
    const rewardKey = TYPE_TO_REWARD_KEY[r.type];
    const reward = REWARDS[rewardKey];
    return {
      id: r.id,
      reminderId: r.id,
      title: r.title,
      dueLabel: dueLabelFor(days),
      category: categoryFor(r, days),
      rewardKey,
      rewardXp: reward.xp,
      rewardCoins: reward.coins,
      done: !!r.done,
    };
  });

  return {
    daily: missions.filter((m) => m.category === "diaria"),
    weekly: missions.filter((m) => m.category === "semanal"),
    special: missions.filter((m) => m.category === "especial"),
  };
}
