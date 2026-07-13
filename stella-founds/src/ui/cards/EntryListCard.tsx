import type { FinanceEntry } from '../../core/models';
import { formatCurrency } from '../../core/utils/currency';
import { toDateOnly } from '../../core/utils/date';
import { effectiveStatus } from '../../core/utils/status';
import { StellaCard } from '../components/StellaCard';
import { StellaEmptyState } from '../components/StellaEmptyState';
import { StellaStatusPill } from '../components/StellaStatusPill';
import './EntryListCard.css';

export function EntryListCard({
  title,
  entries,
  emptyTitle,
  emptyMessage,
  referenceIso,
}: {
  title: string;
  entries: FinanceEntry[];
  emptyTitle: string;
  emptyMessage: string;
  referenceIso: string;
}) {
  return (
    <StellaCard className="entry-list-card">
      <h2 className="entry-list-card__title">{title}</h2>
      {entries.length === 0 ? (
        <StellaEmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        <ul className="entry-list-card__list">
          {entries.map((entry) => (
            <li key={entry.id} className="entry-list-card__item">
              <div className="entry-list-card__info">
                <span className="entry-list-card__name">{entry.title}</span>
                <span className="entry-list-card__date">
                  {toDateOnly(entry.dueDate ?? entry.updatedAt)}
                </span>
              </div>
              <div className="entry-list-card__meta">
                <span className="entry-list-card__amount">{formatCurrency(entry.amount)}</span>
                <StellaStatusPill status={effectiveStatus(entry, referenceIso)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </StellaCard>
  );
}
