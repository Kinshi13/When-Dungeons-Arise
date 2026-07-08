import { TIME_FILTER_ORDER, TIME_FILTER_LABEL, type TimeFilter } from "../core/domain/calendarEntries";

interface TimeFilterBarProps {
  value: TimeFilter;
  onChange: (filter: TimeFilter) => void;
}

// Compartilhado por Calendar.tsx (Mês/Agenda) e LinhaDoTempo.tsx — mesmo
// padrão visual de .filters/.filter já usado em Bills.tsx e MissionList.tsx.
export default function TimeFilterBar({ value, onChange }: TimeFilterBarProps) {
  return (
    <div className="filters">
      {TIME_FILTER_ORDER.map((f) => (
        <button key={f} className={value === f ? "filter active" : "filter"} onClick={() => onChange(f)}>
          {TIME_FILTER_LABEL[f]}
        </button>
      ))}
    </div>
  );
}
