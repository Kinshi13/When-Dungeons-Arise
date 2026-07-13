import type { CalendarFinanceMark, FinanceEntry } from '../../core/models';

export type CalendarFilter = 'all' | 'toPay' | 'paid' | 'toReceive' | 'subscriptions';

export const calendarFilters: { id: CalendarFilter; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'toPay', label: 'A pagar' },
  { id: 'paid', label: 'Pago' },
  { id: 'toReceive', label: 'Receber' },
  { id: 'subscriptions', label: 'Assinaturas' },
];

export function matchesCalendarFilter(
  mark: CalendarFinanceMark,
  entry: FinanceEntry | undefined,
  filter: CalendarFilter,
): boolean {
  if (!entry) return false;

  switch (filter) {
    case 'toPay':
      return (mark.kind === 'finance_due' || mark.kind === 'subscription_due') && entry.type !== 'income';
    case 'paid':
      return mark.kind === 'finance_paid';
    case 'toReceive':
      return entry.type === 'income';
    case 'subscriptions':
      return entry.type === 'subscription';
    case 'all':
    default:
      return true;
  }
}
