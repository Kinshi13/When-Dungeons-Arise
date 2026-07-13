import type { FinanceEntry, FinanceEntryType } from '../models';
import type {
  FinanceEntryRepository,
  CalendarFinanceMarkRepository,
} from '../repositories';
import { generateId } from '../utils/id';
import { todayIso } from '../utils/date';
import { emitFinanceChanged } from '../events';

export interface CreateFinanceEntryInput {
  title: string;
  amount: number;
  type: FinanceEntryType;
  categoryId: string | null;
  nucleusId: string | null;
  dueDate: string | null;
  notes: string | null;
  recurrenceRuleId?: string | null;
}

export type UpdateFinanceEntryInput = Omit<CreateFinanceEntryInput, 'recurrenceRuleId'>;

export class FinanceService {
  private readonly entries: FinanceEntryRepository;
  private readonly marks: CalendarFinanceMarkRepository;

  constructor(entries: FinanceEntryRepository, marks: CalendarFinanceMarkRepository) {
    this.entries = entries;
    this.marks = marks;
  }

  async createEntry(input: CreateFinanceEntryInput): Promise<FinanceEntry> {
    const now = todayIso();
    const isIncome = input.type === 'income';
    const entry: FinanceEntry = {
      id: generateId(),
      title: input.title,
      amount: input.amount,
      type: input.type,
      status: 'pending',
      categoryId: input.categoryId,
      nucleusId: input.nucleusId,
      dueDate: input.dueDate,
      paidAt: null,
      receivedAt: null,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
      recurrenceRuleId: input.recurrenceRuleId ?? null,
    };
    await this.entries.save(entry);

    if (input.dueDate) {
      await this.marks.save({
        id: generateId(),
        sourceType: input.type,
        sourceId: entry.id,
        date: input.dueDate,
        kind: isIncome ? 'finance_due' : entry.type === 'subscription' ? 'subscription_due' : 'finance_due',
      });
    }

    emitFinanceChanged();
    return entry;
  }

  async updateEntry(id: string, input: UpdateFinanceEntryInput): Promise<FinanceEntry> {
    const entry = await this.requireEntry(id);
    const updated: FinanceEntry = {
      ...entry,
      title: input.title,
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId,
      nucleusId: input.nucleusId,
      dueDate: input.dueDate,
      notes: input.notes,
      updatedAt: todayIso(),
    };
    await this.entries.save(updated);

    if (input.dueDate) {
      await this.marks.removeBySource(id);
      await this.marks.save({
        id: generateId(),
        sourceType: updated.type,
        sourceId: id,
        date: input.dueDate,
        kind: updated.type === 'subscription' ? 'subscription_due' : 'finance_due',
      });
    }

    emitFinanceChanged();
    return updated;
  }

  async markAsPaid(id: string, paidAt: string = todayIso()): Promise<FinanceEntry> {
    const entry = await this.requireEntry(id);
    const updated: FinanceEntry = {
      ...entry,
      status: 'paid',
      paidAt,
      updatedAt: todayIso(),
    };
    await this.entries.save(updated);
    await this.marks.save({
      id: generateId(),
      sourceType: entry.type,
      sourceId: entry.id,
      date: paidAt,
      kind: 'finance_paid',
    });
    emitFinanceChanged();
    return updated;
  }

  async markAsReceived(id: string, receivedAt: string = todayIso()): Promise<FinanceEntry> {
    const entry = await this.requireEntry(id);
    const updated: FinanceEntry = {
      ...entry,
      status: 'received',
      receivedAt,
      updatedAt: todayIso(),
    };
    await this.entries.save(updated);
    await this.marks.save({
      id: generateId(),
      sourceType: entry.type,
      sourceId: entry.id,
      date: receivedAt,
      kind: 'finance_received',
    });
    emitFinanceChanged();
    return updated;
  }

  async cancelEntry(id: string): Promise<FinanceEntry> {
    const entry = await this.requireEntry(id);
    const updated: FinanceEntry = {
      ...entry,
      status: 'cancelled',
      updatedAt: todayIso(),
    };
    await this.entries.save(updated);
    emitFinanceChanged();
    return updated;
  }

  async deleteEntry(id: string): Promise<void> {
    await this.entries.remove(id);
    await this.marks.removeBySource(id);
    emitFinanceChanged();
  }

  private async requireEntry(id: string): Promise<FinanceEntry> {
    const entry = await this.entries.get(id);
    if (!entry) {
      throw new Error(`FinanceEntry ${id} not found`);
    }
    return entry;
  }
}
