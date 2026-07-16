import type { FinanceEntry } from '../models';
import type { FinanceEntryRepository } from '../repositories';
import { monthKey, toDateOnly, todayIso } from '../utils/date';

export interface HomeSummary {
  gastoHoje: number;
  proximaConta: FinanceEntry | null;
  assinaturasMes: number;
  previstoAposContas: number;
  /** Total de entradas (income) previstas no mês corrente. */
  entradasMes: number;
  /** Total de contas e assinaturas pendentes no mês corrente. */
  saidasMes: number;
  proximosVencimentos: FinanceEntry[];
  ultimosLancamentos: FinanceEntry[];
  alertas: FinanceEntry[];
}

function isOverdue(entry: FinanceEntry, today: string): boolean {
  return entry.status === 'pending' && !!entry.dueDate && entry.dueDate < today;
}

export class HomeSummaryService {
  private readonly entries: FinanceEntryRepository;

  constructor(entries: FinanceEntryRepository) {
    this.entries = entries;
  }

  async getSummary(referenceIso: string = todayIso()): Promise<HomeSummary> {
    const all = await this.entries.list();
    const today = toDateOnly(referenceIso);
    const currentMonth = monthKey(referenceIso);
    const active = all.filter((entry) => entry.status !== 'cancelled');

    const gastoHoje = active
      .filter((entry) => entry.type === 'expense')
      .filter((entry) => toDateOnly(entry.paidAt ?? entry.dueDate ?? entry.createdAt) === today)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const proximaConta =
      active
        .filter((entry) => (entry.type === 'bill' || entry.type === 'subscription') && entry.status === 'pending' && entry.dueDate)
        .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0] ?? null;

    const assinaturasMes = active
      .filter((entry) => entry.type === 'subscription' && entry.dueDate && monthKey(entry.dueDate) === currentMonth)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalIncomeMonth = active
      .filter((entry) => entry.type === 'income' && entry.dueDate && monthKey(entry.dueDate) === currentMonth)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalDueMonth = active
      .filter(
        (entry) =>
          (entry.type === 'bill' || entry.type === 'subscription') &&
          entry.status === 'pending' &&
          entry.dueDate &&
          monthKey(entry.dueDate) === currentMonth,
      )
      .reduce((sum, entry) => sum + entry.amount, 0);

    const previstoAposContas = totalIncomeMonth - totalDueMonth;

    const proximosVencimentos = active
      .filter((entry) => entry.status === 'pending' && entry.dueDate)
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
      .slice(0, 5);

    const ultimosLancamentos = [...all]
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 5);

    const alertas = active.filter((entry) => isOverdue(entry, today));

    return {
      gastoHoje,
      proximaConta,
      assinaturasMes,
      previstoAposContas,
      entradasMes: totalIncomeMonth,
      saidasMes: totalDueMonth,
      proximosVencimentos,
      ultimosLancamentos,
      alertas,
    };
  }
}
