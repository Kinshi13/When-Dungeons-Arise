import { useEffect, useMemo, useState } from 'react';
import { useAppContainer } from '../../core/AppContainerContext';
import { onFinanceChanged } from '../../core/events';
import type { FinanceCategory, FinanceEntry, FinanceNucleus } from '../../core/models';
import { formatCurrency } from '../../core/utils/currency';
import { toDateOnly, todayIso } from '../../core/utils/date';
import { effectiveStatus } from '../../core/utils/status';
import { EmptyState } from '../../ui/components/EmptyState';
import { ScreenShell } from '../../ui/components/ScreenShell';
import { StatusPill } from '../../ui/components/StatusPill';
import { financeEntryTypeIcons } from '../../ui/icons/typeIcons';
import { useFinanceDialog } from '../finance/FinanceDialogContext';
import { applyBillsFilter, billsFilters, isDueSoon, type BillsFilter } from './billsFilters';
import './BillsScreen.css';

const typeIcons = financeEntryTypeIcons;

const emptyMessages: Record<BillsFilter, { title: string; message: string }> = {
  all: { title: 'Nenhuma conta por enquanto', message: 'Seu céu financeiro está limpo.' },
  upcoming: { title: 'Nenhum vencimento por enquanto', message: 'Seu céu financeiro está limpo.' },
  toPay: { title: 'Nada a pagar', message: 'Você está em dia.' },
  paid: { title: 'Nenhuma conta paga ainda', message: 'Assim que pagar algo, aparece aqui.' },
  toReceive: { title: 'Nada a receber', message: 'Sem valores pendentes de recebimento.' },
  subscriptions: { title: 'Nenhuma assinatura', message: 'Suas assinaturas vão aparecer aqui.' },
  recurring: { title: 'Nenhum lançamento recorrente', message: 'Marque "repetir mensalmente" ao criar uma conta.' },
  overdue: { title: 'Nada vencido', message: 'Seu céu financeiro está limpo.' },
};

export function BillsScreen() {
  const { financeEntryRepository, financeCategoryRepository, financeNucleusRepository, financeService } =
    useAppContainer();
  const { openEdit } = useFinanceDialog();
  const [entries, setEntries] = useState<FinanceEntry[] | null>(null);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [nuclei, setNuclei] = useState<FinanceNucleus[]>([]);
  const [filter, setFilter] = useState<BillsFilter>('all');
  const today = todayIso();

  useEffect(() => {
    let cancelled = false;
    function load() {
      financeEntryRepository.list().then((result) => {
        if (!cancelled) setEntries(result);
      });
    }
    load();
    financeCategoryRepository.list().then((result) => !cancelled && setCategories(result));
    financeNucleusRepository.list().then((result) => !cancelled && setNuclei(result));
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [financeEntryRepository, financeCategoryRepository, financeNucleusRepository]);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const nucleusMap = useMemo(() => new Map(nuclei.map((nucleus) => [nucleus.id, nucleus])), [nuclei]);

  if (!entries) {
    return (
      <ScreenShell title="Contas">
        <p>Carregando…</p>
      </ScreenShell>
    );
  }

  const notCancelled = entries.filter((entry) => entry.status !== 'cancelled');
  const filtered = applyBillsFilter(notCancelled, filter, today).sort((a, b) =>
    (a.dueDate ?? a.createdAt) < (b.dueDate ?? b.createdAt) ? -1 : 1,
  );
  const empty = emptyMessages[filter];

  return (
    <ScreenShell title="Contas">
      <div className="bills-filters">
        {billsFilters.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`bills-filters__chip${filter === option.id ? ' is-active' : ''}`}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={empty.title} message={empty.message} />
      ) : (
        <ul className="bills-list">
          {filtered.map((entry) => {
            const status = effectiveStatus(entry, today);
            const settled = status === 'paid' || status === 'received';
            const overdue = status === 'overdue';
            const dueSoon = !overdue && isDueSoon(entry, today);
            const category = entry.categoryId ? categoryMap.get(entry.categoryId) : undefined;
            const nucleus = entry.nucleusId ? nucleusMap.get(entry.nucleusId) : undefined;

            return (
              <li
                key={entry.id}
                className={`bills-list__item${settled ? ' is-settled' : ''}${overdue ? ' is-overdue' : ''}${dueSoon ? ' is-due-soon' : ''}`}
              >
                <div className="bills-list__info">
                  <span className="bills-list__title">
                    <span className="bills-list__type-icon" aria-hidden="true">
                      {typeIcons[entry.type]}
                    </span>
                    {entry.title}
                  </span>
                  <span className="bills-list__date">
                    {entry.dueDate ? toDateOnly(entry.dueDate) : 'sem vencimento'}
                  </span>
                  {(category || nucleus) && (
                    <span className="bills-list__tags">
                      {category && (
                        <span className="bills-list__tag">
                          {category.icon} {category.name}
                        </span>
                      )}
                      {nucleus && (
                        <span className="bills-list__tag">
                          {nucleus.icon} {nucleus.name}
                        </span>
                      )}
                    </span>
                  )}
                  {entry.notes && <span className="bills-list__notes">{entry.notes}</span>}
                </div>

                <div className="bills-list__meta">
                  <span className="bills-list__amount">{formatCurrency(entry.amount)}</span>
                  <StatusPill status={status} />
                </div>

                <div className="bills-list__actions">
                  {entry.status === 'pending' && entry.type === 'income' && (
                    <button type="button" onClick={() => financeService.markAsReceived(entry.id)}>
                      Receber
                    </button>
                  )}
                  {entry.status === 'pending' && entry.type !== 'income' && (
                    <button type="button" onClick={() => financeService.markAsPaid(entry.id)}>
                      Pagar
                    </button>
                  )}
                  <button type="button" onClick={() => openEdit(entry)}>
                    Editar
                  </button>
                  {entry.status === 'pending' && (
                    <button type="button" onClick={() => financeService.cancelEntry(entry.id)}>
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    className="bills-list__danger"
                    onClick={() => financeService.deleteEntry(entry.id)}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </ScreenShell>
  );
}
