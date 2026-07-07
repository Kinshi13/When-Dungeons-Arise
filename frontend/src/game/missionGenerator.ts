import type { Priority, Reminder } from "../api";
import type { MissionCategory } from "../components/game/PixelMissionCard";

export interface Mission {
  id: string;
  reminderId: string;
  title: string;
  dueLabel: string;
  category: MissionCategory;
  priority: Priority;
  done: boolean;
  fromNote: boolean;
  // Já passou da data — usado pela aba "Hoje" do Mural pra destacar essas
  // acima das demais diárias, em vez de misturadas sem hierarquia.
  overdue: boolean;
}

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
    return {
      id: r.id,
      reminderId: r.id,
      title: r.title,
      dueLabel: dueLabelFor(days),
      category: categoryFor(r, days),
      priority: r.priority ?? "MEDIA",
      done: !!r.done,
      fromNote: !!r.fromNote,
      overdue: days < 0,
    };
  });

  return {
    daily: missions.filter((m) => m.category === "diaria"),
    weekly: missions.filter((m) => m.category === "semanal"),
    special: missions.filter((m) => m.category === "especial"),
  };
}
