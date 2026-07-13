import type { RecurringRule } from '../models';
import { daysInMonth, monthKey } from '../utils/date';

export interface Occurrence {
  dueDate: string;
  occurrenceMonth: string;
}

function firstOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1);
}

export function computeUpcomingOccurrences(
  rule: RecurringRule,
  referenceDate: Date,
  monthsAhead: number,
): Occurrence[] {
  const occurrences: Occurrence[] = [];
  const ruleStart = new Date(rule.startDate);
  const ruleStartMonth = firstOfMonth(ruleStart.getFullYear(), ruleStart.getMonth());
  const ruleEnd = rule.endDate ? new Date(rule.endDate) : null;

  for (let i = 0; i <= monthsAhead; i += 1) {
    const targetYear = referenceDate.getFullYear();
    const targetMonthIndex = referenceDate.getMonth() + i;
    const target = firstOfMonth(targetYear, targetMonthIndex);

    if (target < ruleStartMonth) continue;
    if (ruleEnd && target > ruleEnd) continue;

    const day = Math.min(rule.dueDay, daysInMonth(target.getFullYear(), target.getMonth()));
    const dueDate = new Date(target.getFullYear(), target.getMonth(), day).toISOString();

    occurrences.push({ dueDate, occurrenceMonth: monthKey(dueDate) });
  }

  return occurrences;
}
