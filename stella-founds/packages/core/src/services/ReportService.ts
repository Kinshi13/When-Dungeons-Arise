import type { FinanceEntry } from '../models';
import type { FinanceEntryRepository } from '../repositories';
import { monthKey } from '../utils/date';

export interface ReportFilter {
  monthKey: string;
  nucleusId: string | null;
}

export interface BreakdownItem {
  id: string | null;
  amount: number;
}

export interface ReportSummary {
  totalGasto: number;
  totalPago: number;
  totalAPagar: number;
  totalAReceber: number;
  totalAssinaturas: number;
  previsaoMes: number;
  porCategoria: BreakdownItem[];
  porNucleo: BreakdownItem[];
}

function entryMonthKey(entry: FinanceEntry): string | null {
  const date = entry.paidAt ?? entry.receivedAt ?? entry.dueDate ?? entry.createdAt;
  return date ? monthKey(date) : null;
}

function sumBy(entries: FinanceEntry[], groupKey: (entry: FinanceEntry) => string | null): BreakdownItem[] {
  const totals = new Map<string | null, number>();
  for (const entry of entries) {
    const key = groupKey(entry);
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  }
  return [...totals.entries()]
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export class ReportService {
  private readonly entries: FinanceEntryRepository;

  constructor(entries: FinanceEntryRepository) {
    this.entries = entries;
  }

  async getSummary(filter: ReportFilter): Promise<ReportSummary> {
    const all = await this.entries.list();
    const active = all.filter((entry) => entry.status !== 'cancelled');
    const scoped = filter.nucleusId ? active.filter((entry) => entry.nucleusId === filter.nucleusId) : active;
    const monthEntries = scoped.filter((entry) => entryMonthKey(entry) === filter.monthKey);

    const totalGasto = monthEntries
      .filter((entry) => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalPago = monthEntries
      .filter((entry) => entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalAPagar = monthEntries
      .filter((entry) => entry.status === 'pending' && entry.type !== 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalAReceber = monthEntries
      .filter((entry) => entry.status === 'pending' && entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalAssinaturas = monthEntries
      .filter((entry) => entry.type === 'subscription')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalIncome = monthEntries
      .filter((entry) => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const previsaoMes = totalIncome - totalAPagar;

    const outflow = monthEntries.filter((entry) => entry.type !== 'income');
    const porCategoria = sumBy(outflow, (entry) => entry.categoryId);
    const porNucleo = sumBy(outflow, (entry) => entry.nucleusId);

    return {
      totalGasto,
      totalPago,
      totalAPagar,
      totalAReceber,
      totalAssinaturas,
      previsaoMes,
      porCategoria,
      porNucleo,
    };
  }
}
