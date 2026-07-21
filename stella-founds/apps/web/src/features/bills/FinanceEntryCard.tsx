import type { KeyboardEvent } from 'react';
import {
  formatCurrency,
  toDateOnly,
  effectiveStatus,
  isFinanceEntryDueSoon,
  todayIso,
  type FinanceCategory,
  type FinanceEntry,
  type FinanceNucleus,
} from '@stella-founds/core';
import {
  StellaCard,
  StellaButton,
  StellaStatusPill,
  CardConstellation,
  constellationSeedFromString,
  financeEntryTypeIcons,
} from '@stella-founds/stella-ui';
import './FinanceEntryCard.css';

export interface FinanceEntryCardProps {
  entry: FinanceEntry;
  category?: FinanceCategory;
  nucleus?: FinanceNucleus;
  selected?: boolean;
  busy?: boolean;
  onSelect: (entry: FinanceEntry) => void;
  onMarkSettled: (entry: FinanceEntry) => void;
  onEdit: (entry: FinanceEntry) => void;
  onCancel: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
}

/**
 * A single finance entry — reused as both a desktop/tablet list row and a
 * mobile stacked card (FinanceEntryList just arranges these; the entry
 * markup and quick actions live here once).
 */
export function FinanceEntryCard({
  entry,
  category,
  nucleus,
  selected = false,
  busy = false,
  onSelect,
  onMarkSettled,
  onEdit,
  onCancel,
  onDelete,
}: FinanceEntryCardProps) {
  const today = todayIso();
  const status = effectiveStatus(entry, today);
  const settled = status === 'paid' || status === 'received';
  const overdue = status === 'overdue';
  const cancelled = status === 'cancelled';
  const dueSoon = !overdue && isFinanceEntryDueSoon(entry, today);

  const classes = [
    'finance-entry-card',
    settled && 'is-settled',
    overdue && 'is-overdue',
    dueSoon && 'is-due-soon',
    cancelled && 'is-cancelled',
    selected && 'is-selected',
  ]
    .filter(Boolean)
    .join(' ');

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(entry);
    }
  }

  return (
    <StellaCard
      as="li"
      interactive
      className={classes}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${entry.title}`}
      onClick={() => onSelect(entry)}
      onKeyDown={handleKeyDown}
    >
      <CardConstellation variant={constellationSeedFromString(entry.id)} selected={selected} />
      <div className="finance-entry-card__info">
        <span className="finance-entry-card__title">
          <span className="finance-entry-card__type-icon" aria-hidden="true">
            {financeEntryTypeIcons[entry.type]}
          </span>
          {entry.title}
        </span>
        <span className="finance-entry-card__date">{entry.dueDate ? toDateOnly(entry.dueDate) : 'sem vencimento'}</span>
        {(category || nucleus || entry.recurrenceRuleId) && (
          <span className="finance-entry-card__tags">
            {category && (
              <span className="finance-entry-card__tag">
                {category.icon} {category.name}
              </span>
            )}
            {nucleus && (
              <span className="finance-entry-card__tag">
                {nucleus.icon} {nucleus.name}
              </span>
            )}
            {entry.recurrenceRuleId && <span className="finance-entry-card__tag">↻ recorrente</span>}
          </span>
        )}
      </div>

      <div className="finance-entry-card__meta">
        <span className="finance-entry-card__amount">{formatCurrency(entry.amount)}</span>
        <StellaStatusPill status={status} />
      </div>

      <div className="finance-entry-card__actions" onClick={(event) => event.stopPropagation()}>
        {entry.status === 'pending' && (
          <StellaButton disabled={busy} onClick={() => onMarkSettled(entry)}>
            {entry.type === 'income' ? 'Receber' : 'Pagar'}
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
    </StellaCard>
  );
}
