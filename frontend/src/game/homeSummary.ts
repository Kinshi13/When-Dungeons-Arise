import type { Bill, Reminder } from "../api";

const HORIZON_DAYS = 7;

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function upcoming<T>(items: T[], dateOf: (item: T) => string): T[] {
  return items
    .filter((item) => daysUntil(dateOf(item)) >= -1 && daysUntil(dateOf(item)) <= HORIZON_DAYS)
    .sort((a, b) => new Date(dateOf(a)).getTime() - new Date(dateOf(b)).getTime());
}

export interface HomeSummaryCard {
  key: string;
  label: string;
  count: number;
  nextLabel: string | null;
  to: string;
}

export function buildHomeSummary(reminders: Reminder[], bills: Bill[]): HomeSummaryCard[] {
  const pending = reminders.filter((r) => !r.done);
  const events = upcoming(pending.filter((r) => r.type === "OUTRO"), (r) => r.dateTime);
  const meetings = upcoming(pending.filter((r) => r.type === "REUNIAO"), (r) => r.dateTime);
  const tasks = upcoming(pending.filter((r) => r.type === "TAREFA"), (r) => r.dateTime);
  const dueBills = upcoming(
    bills.filter((b) => !b.paid),
    (b) => b.dueDate
  );

  return [
    {
      key: "events",
      label: "Próximos eventos",
      count: events.length,
      nextLabel: events[0]?.title ?? null,
      to: "/missoes",
    },
    {
      key: "meetings",
      label: "Reuniões",
      count: meetings.length,
      nextLabel: meetings[0]?.title ?? null,
      to: "/missoes",
    },
    {
      key: "tasks",
      label: "Tarefas",
      count: tasks.length,
      nextLabel: tasks[0]?.title ?? null,
      to: "/missoes",
    },
    {
      key: "bills",
      label: "Contas próximas",
      count: dueBills.length,
      nextLabel: dueBills[0]?.title ?? null,
      to: "/tesouraria",
    },
  ];
}
