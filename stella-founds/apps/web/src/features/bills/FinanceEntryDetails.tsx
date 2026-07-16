import {
  formatCurrency,
  toDateOnly,
  effectiveStatus,
  todayIso,
  type FinanceCategory,
  type FinanceEntry,
  type FinanceNucleus,
} from '@stella-founds/core';
import { StellaButton, StellaStatusPill, StellaSectionHeader, financeEntryTypeIcons } from '@stella-founds/stella-ui';
import './FinanceEntryDetails.css';

export function FinanceEntryDetails({
  entry,
  category,
  nucleus,
  busy = false,
  onMarkSettled,
  onEdit,
  onCancel,
  onDelete,
}: {
  entry: FinanceEntry;
  category?: FinanceCategory;
  nucleus?: FinanceNucleus;
  busy?: boolean;
  onMarkSettled: (entry: FinanceEntry) => void;
  onEdit: (entry: FinanceEntry) => void;
  onCancel: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
}) {
  const status = effectiveStatus(entry, todayIso());

  return (
    <div className="finance-entry-details">
      <StellaSectionHeader title="Detalhes" />

      <div className="finance-entry-details__title">
        <span aria-hidden="true">{financeEntryTypeIcons[entry.type]}</span>
        {entry.title}
      </div>

      <div className="finance-entry-details__amount">{formatCurrency(entry.amount)}</div>
      <StellaStatusPill status={status} />

      <dl className="finance-entry-details__fields">
        <div>
          <dt>Vencimento</dt>
          <dd>{entry.dueDate ? toDateOnly(entry.dueDate) : 'Sem vencimento'}</dd>
        </div>
        {category && (
          <div>
            <dt>Categoria</dt>
            <dd>
              {category.icon} {category.name}
            </dd>
          </div>
        )}
        {nucleus && (
          <div>
            <dt>Núcleo</dt>
            <dd>
              {nucleus.icon} {nucleus.name}
            </dd>
          </div>
        )}
        {entry.recurrenceRuleId && (
          <div>
            <dt>Recorrência</dt>
            <dd>↻ Mensal</dd>
          </div>
        )}
        {entry.notes && (
          <div>
            <dt>Observação</dt>
            <dd>{entry.notes}</dd>
          </div>
        )}
      </dl>

      <div className="finance-entry-details__actions">
        {entry.status === 'pending' && (
          <StellaButton variant="primary" disabled={busy} onClick={() => onMarkSettled(entry)}>
            {entry.type === 'income' ? 'Marcar como recebida' : 'Marcar como paga'}
          </StellaButton>
        )}
        <StellaButton disabled={busy} onClick={() => onEdit(entry)}>
          Editar
        </StellaButton>
        {entry.status === 'pending' && (
          <StellaButton disabled={busy} onClick={() => onCancel(entry)}>
            Cancelar
          </StellaButton>
        )}
        <StellaButton variant="danger" disabled={busy} onClick={() => onDelete(entry)}>
          Excluir
        </StellaButton>
      </div>
    </div>
  );
}
