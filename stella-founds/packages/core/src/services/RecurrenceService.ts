import type { FinanceEntry } from '../models';
import type {
  FinanceEntryRepository,
  RecurringRuleRepository,
  CalendarFinanceMarkRepository,
} from '../repositories';
import { computeUpcomingOccurrences } from '../recurrence';
import { generateId } from '../utils/id';
import { monthKey, todayIso } from '../utils/date';
import { emitFinanceChanged } from '../events';

const DEFAULT_MONTHS_AHEAD = 3;

export class RecurrenceService {
  private readonly rules: RecurringRuleRepository;
  private readonly entries: FinanceEntryRepository;
  private readonly marks: CalendarFinanceMarkRepository;

  constructor(rules: RecurringRuleRepository, entries: FinanceEntryRepository, marks: CalendarFinanceMarkRepository) {
    this.rules = rules;
    this.entries = entries;
    this.marks = marks;
  }

  async generateForRule(ruleId: string, monthsAhead: number = DEFAULT_MONTHS_AHEAD): Promise<FinanceEntry[]> {
    const rule = await this.rules.get(ruleId);
    if (!rule || !rule.active) return [];

    const existing = await this.entries.listByRule(ruleId);
    const existingMonths = new Set(
      existing.filter((entry) => entry.dueDate).map((entry) => monthKey(entry.dueDate!)),
    );

    const occurrences = computeUpcomingOccurrences(rule, new Date(), monthsAhead);
    const created: FinanceEntry[] = [];
    const now = todayIso();

    for (const occurrence of occurrences) {
      if (existingMonths.has(occurrence.occurrenceMonth)) continue;

      const entry: FinanceEntry = {
        id: generateId(),
        title: rule.title,
        amount: rule.amount,
        type: rule.type,
        status: 'pending',
        categoryId: rule.categoryId,
        nucleusId: rule.nucleusId,
        dueDate: occurrence.dueDate,
        paidAt: null,
        receivedAt: null,
        createdAt: now,
        updatedAt: now,
        notes: null,
        recurrenceRuleId: rule.id,
      };
      await this.entries.save(entry);
      await this.marks.save({
        id: generateId(),
        sourceType: entry.type,
        sourceId: entry.id,
        date: occurrence.dueDate,
        kind: entry.type === 'subscription' ? 'subscription_due' : 'finance_due',
      });

      existingMonths.add(occurrence.occurrenceMonth);
      created.push(entry);
    }

    if (created.length > 0) emitFinanceChanged();
    return created;
  }

  async generateAll(monthsAhead: number = DEFAULT_MONTHS_AHEAD): Promise<void> {
    const activeRules = await this.rules.listActive();
    for (const rule of activeRules) {
      await this.generateForRule(rule.id, monthsAhead);
    }
  }
}
