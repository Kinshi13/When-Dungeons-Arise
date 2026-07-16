import type { FinanceCategory, FinanceEntry, FinanceNucleus } from '@stella-founds/core';
import { StellaEmptyState } from '@stella-founds/stella-ui';
import { FinanceEntryCard } from './FinanceEntryCard';
import './FinanceEntryList.css';

export function FinanceEntryList({
  entries,
  categoryMap,
  nucleusMap,
  selectedId,
  busyId,
  emptyTitle,
  emptyMessage,
  onSelect,
  onMarkSettled,
  onEdit,
  onCancel,
  onDelete,
}: {
  entries: FinanceEntry[];
  categoryMap: Map<string, FinanceCategory>;
  nucleusMap: Map<string, FinanceNucleus>;
  selectedId?: string;
  busyId?: string | null;
  emptyTitle: string;
  emptyMessage: string;
  onSelect: (entry: FinanceEntry) => void;
  onMarkSettled: (entry: FinanceEntry) => void;
  onEdit: (entry: FinanceEntry) => void;
  onCancel: (entry: FinanceEntry) => void;
  onDelete: (entry: FinanceEntry) => void;
}) {
  if (entries.length === 0) {
    return <StellaEmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <ul className="finance-entry-list">
      {entries.map((entry) => (
        <FinanceEntryCard
          key={entry.id}
          entry={entry}
          category={entry.categoryId ? categoryMap.get(entry.categoryId) : undefined}
          nucleus={entry.nucleusId ? nucleusMap.get(entry.nucleusId) : undefined}
          selected={selectedId === entry.id}
          busy={busyId === entry.id}
          onSelect={onSelect}
          onMarkSettled={onMarkSettled}
          onEdit={onEdit}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
