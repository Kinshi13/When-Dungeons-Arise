import { financeEntryFilters, type FinanceEntryFilter } from '@stella-founds/core';
import { StellaButton } from '@stella-founds/stella-ui';
import './BillsFiltersBar.css';

export function BillsFiltersBar({
  value,
  onChange,
}: {
  value: FinanceEntryFilter;
  onChange: (filter: FinanceEntryFilter) => void;
}) {
  return (
    <div className="bills-filters-bar" role="tablist" aria-label="Filtrar lançamentos">
      {financeEntryFilters.map((option) => (
        <StellaButton
          key={option.id}
          variant="chip"
          role="tab"
          aria-selected={value === option.id}
          active={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </StellaButton>
      ))}
    </div>
  );
}
