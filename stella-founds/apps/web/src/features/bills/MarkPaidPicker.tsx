import { useEffect, useState } from 'react';
import { useAppContainer, onFinanceChanged, formatCurrency, toDateOnly, type FinanceEntry } from '@stella-founds/core';
import {
  Modal,
  StellaBottomSheet,
  StellaEmptyState,
  StellaButton,
  StellaListItem,
  useBreakpoint,
  showStellaToast,
} from '@stella-founds/stella-ui';
import './MarkPaidPicker.css';

/** Stella Core "Marcar pagamento" action: a small picker over pending bills/subscriptions (not income — that's "Recebimento"). */
export function MarkPaidPicker({ onClose }: { onClose: () => void }) {
  const { financeEntryRepository, financeService } = useAppContainer();
  const breakpoint = useBreakpoint();
  const [entries, setEntries] = useState<FinanceEntry[] | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      financeEntryRepository
        .list()
        .then((all) => setEntries(all.filter((entry) => entry.status === 'pending' && entry.type !== 'income')));
    }
    load();
    return onFinanceChanged(load);
  }, [financeEntryRepository]);

  async function handlePay(entry: FinanceEntry) {
    if (pendingId) return; // guard against double-click while the request is in flight
    setPendingId(entry.id);
    try {
      await financeService.markAsPaid(entry.id);
      showStellaToast(`"${entry.title}" marcada como paga.`, 'success');
    } catch {
      showStellaToast('Não foi possível marcar como paga.', 'error');
    } finally {
      setPendingId(null);
    }
  }

  const content = (
    <div className="mark-paid-picker">
      {!entries ? (
        <p>Carregando…</p>
      ) : entries.length === 0 ? (
        <StellaEmptyState title="Nada a pagar" message="Você está em dia." />
      ) : (
        <ul className="mark-paid-picker__list">
          {entries.map((entry) => (
            <StellaListItem
              key={entry.id}
              title={entry.title}
              subtitle={entry.dueDate ? `Vence ${toDateOnly(entry.dueDate)}` : 'Sem vencimento'}
              trailing={
                <>
                  <span className="mark-paid-picker__amount">{formatCurrency(entry.amount)}</span>
                  <StellaButton
                    type="button"
                    variant="primary"
                    disabled={pendingId === entry.id}
                    onClick={() => handlePay(entry)}
                  >
                    Pagar
                  </StellaButton>
                </>
              }
            />
          ))}
        </ul>
      )}
    </div>
  );

  if (breakpoint === 'mobile') {
    return (
      <StellaBottomSheet title="Marcar pagamento" onClose={onClose}>
        {content}
      </StellaBottomSheet>
    );
  }

  return (
    <Modal title="Marcar pagamento" onClose={onClose}>
      {content}
    </Modal>
  );
}
