import { useEffect, useMemo, useState } from 'react';
import { useAppContainer } from '../../core/AppContainerContext';
import { onFinanceChanged } from '../../core/events';
import type { CalendarFinanceMark, FinanceEntry } from '../../core/models';
import { formatCurrency } from '../../core/utils/currency';
import { toDateOnly, todayIso } from '../../core/utils/date';
import { ScreenShell } from '../../ui/components/ScreenShell';
import { StellaButton } from '../../ui/components/StellaButton';
import { StellaCard } from '../../ui/components/StellaCard';
import { StellaEmptyState } from '../../ui/components/StellaEmptyState';
import { financeEntryTypeIcons } from '../../ui/icons/typeIcons';
import { useFinanceDialog } from '../finance/FinanceDialogContext';
import { calendarFilters, matchesCalendarFilter, type CalendarFilter } from './calendarFilters';
import { getMonthGrid, monthLabels, toIsoDateOnly, weekdayLabels } from './calendarGrid';
import './CalendarScreen.css';

const markDotClass: Record<CalendarFinanceMark['kind'], string> = {
  finance_due: 'is-due',
  subscription_due: 'is-due',
  finance_paid: 'is-settled',
  finance_received: 'is-settled',
};

export function CalendarScreen() {
  const { calendarFinanceMarkRepository, financeEntryRepository } = useAppContainer();
  const { openEdit } = useFinanceDialog();
  const today = todayIso();
  const todayDateOnly = toDateOnly(today);

  const [marks, setMarks] = useState<CalendarFinanceMark[] | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [viewedYear, setViewedYear] = useState(() => new Date(today).getFullYear());
  const [viewedMonth, setViewedMonth] = useState(() => new Date(today).getMonth());
  const [selectedDate, setSelectedDate] = useState(todayDateOnly);

  useEffect(() => {
    let cancelled = false;
    function load() {
      calendarFinanceMarkRepository.list().then((result) => !cancelled && setMarks(result));
      financeEntryRepository.list().then((result) => !cancelled && setEntries(result));
    }
    load();
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [calendarFinanceMarkRepository, financeEntryRepository]);

  const entryMap = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);

  const visibleMarks = useMemo(() => {
    if (!marks) return [];
    return marks.filter((mark) => matchesCalendarFilter(mark, entryMap.get(mark.sourceId), filter));
  }, [marks, entryMap, filter]);

  const marksByDay = useMemo(() => {
    const map = new Map<string, CalendarFinanceMark[]>();
    for (const mark of visibleMarks) {
      const day = toDateOnly(mark.date);
      const list = map.get(day) ?? [];
      list.push(mark);
      map.set(day, list);
    }
    return map;
  }, [visibleMarks]);

  const weeks = useMemo(() => getMonthGrid(viewedYear, viewedMonth), [viewedYear, viewedMonth]);

  function goToMonth(offset: number) {
    const next = new Date(viewedYear, viewedMonth + offset, 1);
    setViewedYear(next.getFullYear());
    setViewedMonth(next.getMonth());
  }

  function goToToday() {
    const now = new Date(today);
    setViewedYear(now.getFullYear());
    setViewedMonth(now.getMonth());
    setSelectedDate(todayDateOnly);
  }

  if (!marks) {
    return (
      <ScreenShell title="Calendário">
        <p>Carregando…</p>
      </ScreenShell>
    );
  }

  const selectedDayMarks = marksByDay.get(selectedDate) ?? [];

  return (
    <ScreenShell title="Calendário">
      <div className="calendar-filters">
        {calendarFilters.map((option) => (
          <StellaButton
            key={option.id}
            variant="chip"
            active={filter === option.id}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </StellaButton>
        ))}
      </div>

      <div className="calendar-nav">
        <button type="button" className="calendar-nav__arrow" onClick={() => goToMonth(-1)} aria-label="Mês anterior">
          ‹
        </button>
        <span className="calendar-nav__label">
          {monthLabels[viewedMonth]} {viewedYear}
        </span>
        <button type="button" className="calendar-nav__arrow" onClick={() => goToMonth(1)} aria-label="Próximo mês">
          ›
        </button>
        <StellaButton className="calendar-nav__today" onClick={goToToday}>
          Hoje
        </StellaButton>
      </div>

      <div className="calendar-grid">
        {weekdayLabels.map((label) => (
          <span key={label} className="calendar-grid__weekday">
            {label}
          </span>
        ))}
        {weeks.flat().map((day) => {
          const isoDate = toIsoDateOnly(day.date);
          const dayMarks = marksByDay.get(isoDate) ?? [];
          const isToday = isoDate === todayDateOnly;
          const isSelected = isoDate === selectedDate;

          return (
            <button
              key={isoDate}
              type="button"
              className={`calendar-grid__day${day.inCurrentMonth ? '' : ' is-outside'}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
              onClick={() => setSelectedDate(isoDate)}
            >
              <span className="calendar-grid__day-number">{day.date.getDate()}</span>
              {dayMarks.length > 0 && (
                <span className="calendar-grid__dots">
                  {dayMarks.slice(0, 3).map((mark) => (
                    <span key={mark.id} className={`calendar-grid__dot ${markDotClass[mark.kind]}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <StellaCard className="calendar-day-panel">
        <h2 className="calendar-day-panel__title">{selectedDate}</h2>
        {selectedDayMarks.length === 0 ? (
          <StellaEmptyState title="Nada por aqui" message="Nenhum lançamento financeiro neste dia." />
        ) : (
          <ul className="calendar-day-panel__list">
            {selectedDayMarks.map((mark) => {
              const entry = entryMap.get(mark.sourceId);
              if (!entry) return null;
              return (
                <li key={mark.id} className="calendar-day-panel__item">
                  <button type="button" className="calendar-day-panel__button" onClick={() => openEdit(entry)}>
                    <span className="calendar-day-panel__icon" aria-hidden="true">
                      {financeEntryTypeIcons[entry.type]}
                    </span>
                    <span className="calendar-day-panel__info">
                      <span className="calendar-day-panel__title-text">{entry.title}</span>
                      <span className="calendar-day-panel__kind">{markKindLabel(mark.kind)}</span>
                    </span>
                    <span className="calendar-day-panel__amount">{formatCurrency(entry.amount)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </StellaCard>
    </ScreenShell>
  );
}

function markKindLabel(kind: CalendarFinanceMark['kind']): string {
  switch (kind) {
    case 'finance_due':
      return 'Vence hoje';
    case 'subscription_due':
      return 'Assinatura vence hoje';
    case 'finance_paid':
      return 'Pago';
    case 'finance_received':
      return 'Recebido';
    default:
      return '';
  }
}
