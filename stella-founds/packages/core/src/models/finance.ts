export type FinanceEntryType = 'expense' | 'bill' | 'income' | 'subscription';

export type FinanceStatus = 'pending' | 'paid' | 'received' | 'overdue' | 'cancelled';

export interface FinanceEntry {
  id: string;
  title: string;
  amount: number;
  type: FinanceEntryType;
  status: FinanceStatus;
  categoryId: string | null;
  nucleusId: string | null;
  dueDate: string | null;
  paidAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  recurrenceRuleId: string | null;
}

export interface FinanceCategory {
  id: string;
  name: string;
  icon: string;
  colorToken: string;
}

export interface FinanceNucleus {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  colorToken: string;
}

export type RecurrenceFrequency = 'monthly';

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  type: FinanceEntryType;
  categoryId: string | null;
  nucleusId: string | null;
  frequency: RecurrenceFrequency;
  interval: number;
  dueDay: number;
  startDate: string;
  endDate: string | null;
  reminderDaysBefore: number;
  autoGenerate: boolean;
  active: boolean;
}

export type CalendarFinanceKind =
  | 'finance_due'
  | 'finance_paid'
  | 'finance_received'
  | 'subscription_due';

export interface CalendarFinanceMark {
  id: string;
  sourceType: FinanceEntryType;
  sourceId: string;
  date: string;
  kind: CalendarFinanceKind;
}
