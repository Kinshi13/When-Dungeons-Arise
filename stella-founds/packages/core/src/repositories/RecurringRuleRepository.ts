import type { StorageAdapter } from '../storage/StorageAdapter';
import type { RecurringRule } from '../models';
import { BaseRepository } from './BaseRepository';

export class RecurringRuleRepository extends BaseRepository<RecurringRule> {
  constructor(storage: StorageAdapter) {
    super(storage, 'recurringRules');
  }

  async listActive(): Promise<RecurringRule[]> {
    const all = await this.list();
    return all.filter((rule) => rule.active);
  }
}
