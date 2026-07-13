import type { FinanceEntry, FinanceStatus } from '../models';
import { toDateOnly } from './date';

export function effectiveStatus(entry: FinanceEntry, todayIso: string): FinanceStatus {
  if (entry.status === 'pending' && entry.dueDate && entry.dueDate < toDateOnly(todayIso)) {
    return 'overdue';
  }
  return entry.status;
}
