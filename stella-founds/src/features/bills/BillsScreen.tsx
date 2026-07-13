import { useEffect, useState } from 'react';
import { useAppContainer } from '../../core/AppContainerContext';
import { onFinanceChanged } from '../../core/events';
import type { FinanceEntry } from '../../core/models';
import { formatCurrency } from '../../core/utils/currency';
import { toDateOnly, todayIso } from '../../core/utils/date';
import { effectiveStatus } from '../../core/utils/status';
import { EmptyState } from '../../ui/components/EmptyState';
import { ScreenShell } from '../../ui/components/ScreenShell';
import { StatusPill } from '../../ui/components/StatusPill';
import { useFinanceDialog } from '../finance/FinanceDialogContext';
import './BillsScreen.css';

export function BillsScreen() {
  const { financeEntryRepository, financeService } = useAppContainer();
  const { openEdit } = useFinanceDialog();
  const [entries, setEntries] = useState<FinanceEntry[] | null>(null);
  const today = todayIso();

  useEffect(() => {
    let cancelled = false;
    function load() {
      financeEntryRepository.list().then((result) => {
        if (!cancelled) setEntries(result);
      });
    }
    load();
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [financeEntryRepository]);

  if (!entries) {
    return (
      <ScreenShell title="Contas">
        <p>Carregando…</p>
      </ScreenShell>
    );
  }

  const visible = entries
    .filter((entry) => entry.status !== 'cancelled')
    .sort((a, b) => (a.dueDate ?? a.createdAt) < (b.dueDate ?? b.createdAt) ? -1 : 1);

  return (
    <ScreenShell title="Contas">
      {visible.length === 0 ? (
        <EmptyState
          title="Nenhuma conta por enquanto"
          message="Seu céu financeiro está limpo."
        />
      ) : (
        <ul className="bills-list">
          {visible.map((entry) => (
            <li key={entry.id} className="bills-list__item">
              <div className="bills-list__info">
                <span className="bills-list__title">{entry.title}</span>
                <span className="bills-list__date">
                  {entry.dueDate ? toDateOnly(entry.dueDate) : 'sem vencimento'}
                </span>
                {entry.notes && <span className="bills-list__notes">{entry.notes}</span>}
              </div>

              <div className="bills-list__meta">
                <span className="bills-list__amount">{formatCurrency(entry.amount)}</span>
                <StatusPill status={effectiveStatus(entry, today)} />
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
          ))}
        </ul>
      )}
    </ScreenShell>
  );
}
