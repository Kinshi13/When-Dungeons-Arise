import type { StorageAdapter } from '../storage/StorageAdapter';
import type { FinanceEntry } from '../models';
import { BaseRepository } from './BaseRepository';

export class FinanceEntryRepository extends BaseRepository<FinanceEntry> {
  constructor(storage: StorageAdapter) {
    super(storage, 'financeEntries');
  }

  async listByStatus(status: FinanceEntry['status']): Promise<FinanceEntry[]> {
    const all = await this.list();
    return all.filter((entry) => entry.status === status);
  }

  async listByRule(recurrenceRuleId: string): Promise<FinanceEntry[]> {
    const all = await this.list();
    return all.filter((entry) => entry.recurrenceRuleId === recurrenceRuleId);
  }
}
