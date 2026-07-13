import type { StorageAdapter } from '../storage/StorageAdapter';
import type { CalendarFinanceMark } from '../models';
import { BaseRepository } from './BaseRepository';
import { toDateOnly } from '../utils/date';

export class CalendarFinanceMarkRepository extends BaseRepository<CalendarFinanceMark> {
  constructor(storage: StorageAdapter) {
    super(storage, 'calendarFinanceMarks');
  }

  async listByDate(date: string): Promise<CalendarFinanceMark[]> {
    const all = await this.list();
    return all.filter((mark) => toDateOnly(mark.date) === toDateOnly(date));
  }

  async listBySource(sourceId: string): Promise<CalendarFinanceMark[]> {
    const all = await this.list();
    return all.filter((mark) => mark.sourceId === sourceId);
  }

  async removeBySource(sourceId: string): Promise<void> {
    const marks = await this.listBySource(sourceId);
    await Promise.all(marks.map((mark) => this.remove(mark.id)));
  }
}
