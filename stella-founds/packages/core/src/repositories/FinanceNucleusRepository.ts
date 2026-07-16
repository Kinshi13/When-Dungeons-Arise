import type { StorageAdapter } from '../storage/StorageAdapter';
import type { FinanceNucleus } from '../models';
import { BaseRepository } from './BaseRepository';

export class FinanceNucleusRepository extends BaseRepository<FinanceNucleus> {
  constructor(storage: StorageAdapter) {
    super(storage, 'financeNuclei');
  }
}
