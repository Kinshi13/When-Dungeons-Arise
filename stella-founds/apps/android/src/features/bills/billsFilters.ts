import { toDateOnly, effectiveStatus, type FinanceEntry } from '@stella-founds/core';

export type BillsFilter =
  | 'all'
  | 'upcoming'
  | 'toPay'
  | 'paid'
  | 'toReceive'
  | 'subscriptions'
  | 'recurring'
  | 'overdue';

export const billsFilters: { id: BillsFilter; label: string }[] = [
  { id: 'all', label: 'Tudo' },
  { id: 'upcoming', label: 'Próximos vencimentos' },
  { id: 'toPay', label: 'A pagar' },
  { id: 'paid', label: 'Pagas' },
  { id: 'toReceive', label: 'A receber' },
  { id: 'subscriptions', label: 'Assinaturas' },
  { id: 'recurring', label: 'Recorrentes' },
  { id: 'overdue', label: 'Vencidas' },
];

export function applyBillsFilter(entries: FinanceEntry[], filter: BillsFilter, todayIso: string): FinanceEntry[] {
  switch (filter) {
    case 'upcoming':
      return entries.filter((entry) => entry.status === 'pending' && !!entry.dueDate);
    case 'toPay':
      return entries.filter((entry) => entry.type !== 'income' && entry.status === 'pending');
    case 'paid':
      return entries.filter((entry) => entry.status === 'paid' || entry.status === 'received');
    case 'toReceive':
      return entries.filter((entry) => entry.type === 'income' && entry.status === 'pending');
    case 'subscriptions':
      return entries.filter((entry) => entry.type === 'subscription');
    case 'recurring':
      return entries.filter((entry) => !!entry.recurrenceRuleId);
    case 'overdue':
      return entries.filter((entry) => effectiveStatus(entry, todayIso) === 'overdue');
    case 'all':
    default:
      return entries;
  }
}

export function isDueSoon(entry: FinanceEntry, todayIso: string, withinDays = 3): boolean {
  if (entry.status !== 'pending' || !entry.dueDate) return false;
  const due = new Date(toDateOnly(entry.dueDate));
  const today = new Date(toDateOnly(todayIso));
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  return diffDays >= 0 && diffDays <= withinDays;
}
