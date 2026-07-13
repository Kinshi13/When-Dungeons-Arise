import type { StorageAdapter } from '../storage/StorageAdapter';
import type { FinanceCategory } from '../models';
import { BaseRepository } from './BaseRepository';

export class FinanceCategoryRepository extends BaseRepository<FinanceCategory> {
  constructor(storage: StorageAdapter) {
    super(storage, 'financeCategories');
  }
}
