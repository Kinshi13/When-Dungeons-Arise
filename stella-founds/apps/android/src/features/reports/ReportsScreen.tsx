import { useEffect, useMemo, useState } from 'react';
import {
  useAppContainer,
  onFinanceChanged,
  onReportsExportRequested,
  formatCurrency,
  todayIso,
  type FinanceCategory,
  type FinanceNucleus,
  type ReportSummary,
} from '@stella-founds/core';
import {
  StellaAmountCard,
  StellaCard,
  StellaConstellationDivider,
  StellaEmptyState,
  ScreenShell,
} from '@stella-founds/stella-ui';
import './ReportsScreen.css';

const monthLabels = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toMonthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

function Breakdown({
  title,
  items,
  nameFor,
  emptyMessage,
}: {
  title: string;
  items: { id: string | null; amount: number }[];
  nameFor: (id: string | null) => { name: string; icon: string };
  emptyMessage: string;
}) {
  const max = items.length > 0 ? items[0].amount : 0;

  return (
    <StellaCard className="report-breakdown">
      <h2 className="report-breakdown__title">{title}</h2>
      {items.length === 0 ? (
        <StellaEmptyState title="Sem dados" message={emptyMessage} />
      ) : (
        <ul className="report-breakdown__list">
          {items.map((item) => {
            const { name, icon } = nameFor(item.id);
            const percent = max > 0 ? Math.round((item.amount / max) * 100) : 0;
            return (
              <li key={item.id ?? 'none'} className="report-breakdown__item">
                <div className="report-breakdown__row">
                  <span className="report-breakdown__name">
                    {icon} {name}
                  </span>
                  <span className="report-breakdown__amount">{formatCurrency(item.amount)}</span>
                </div>
                <div className="report-breakdown__bar-track">
                  <div className="report-breakdown__bar-fill" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </StellaCard>
  );
}

export function ReportsScreen() {
  const { reportService, financeCategoryRepository, financeNucleusRepository, exportAdapter } = useAppContainer();
  const today = new Date(todayIso());
  const [viewedYear, setViewedYear] = useState(today.getFullYear());
  const [viewedMonth, setViewedMonth] = useState(today.getMonth());
  const [nucleusId, setNucleusId] = useState<string>('');
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [nuclei, setNuclei] = useState<FinanceNucleus[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => {
    financeCategoryRepository.list().then(setCategories);
    financeNucleusRepository.list().then(setNuclei);
  }, [financeCategoryRepository, financeNucleusRepository]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      reportService
        .getSummary({ monthKey: toMonthKey(viewedYear, viewedMonth), nucleusId: nucleusId || null })
        .then((result) => !cancelled && setSummary(result));
    }
    load();
    const unsubscribe = onFinanceChanged(load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [reportService, viewedYear, viewedMonth, nucleusId]);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const nucleusMap = useMemo(() => new Map(nuclei.map((nucleus) => [nucleus.id, nucleus])), [nuclei]);

  useEffect(() => {
    if (!summary) return;
    return onReportsExportRequested(() => {
      const monthKey = toMonthKey(viewedYear, viewedMonth);
      const rows: string[][] = [
        ['Métrica', 'Valor'],
        ['Total gasto', formatCurrency(summary.totalGasto)],
        ['Total pago', formatCurrency(summary.totalPago)],
        ['Total a pagar', formatCurrency(summary.totalAPagar)],
        ['Total a receber', formatCurrency(summary.totalAReceber)],
        ['Assinaturas', formatCurrency(summary.totalAssinaturas)],
        ['Previsão do mês', formatCurrency(summary.previsaoMes)],
        [],
        ['Gastos por categoria'],
        ...summary.porCategoria.map((item) => [
          item.id ? (categoryMap.get(item.id)?.name ?? 'Sem categoria') : 'Sem categoria',
          formatCurrency(item.amount),
        ]),
        [],
        ['Gastos por núcleo'],
        ...summary.porNucleo.map((item) => [
          item.id ? (nucleusMap.get(item.id)?.name ?? 'Sem núcleo') : 'Sem núcleo',
          formatCurrency(item.amount),
        ]),
      ];
      exportAdapter.exportCsv(`stella-founds-relatorio-${monthKey}.csv`, rows);
    });
  }, [summary, categoryMap, nucleusMap, viewedYear, viewedMonth, exportAdapter]);

  function goToMonth(offset: number) {
    const next = new Date(viewedYear, viewedMonth + offset, 1);
    setViewedYear(next.getFullYear());
    setViewedMonth(next.getMonth());
  }

  if (!summary) {
    return (
      <ScreenShell title="Relatórios">
        <p>Carregando…</p>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Relatórios">
      <div className="reports-filters">
        <div className="reports-filters__month">
          <button type="button" className="reports-filters__arrow" onClick={() => goToMonth(-1)} aria-label="Mês anterior">
            ‹
          </button>
          <span>
            {monthLabels[viewedMonth]} {viewedYear}
          </span>
          <button type="button" className="reports-filters__arrow" onClick={() => goToMonth(1)} aria-label="Próximo mês">
            ›
          </button>
        </div>
        <select className="stella-input" value={nucleusId} onChange={(event) => setNucleusId(event.target.value)}>
          <option value="">Todos os núcleos</option>
          {nuclei.map((nucleus) => (
            <option key={nucleus.id} value={nucleus.id}>
              {nucleus.icon} {nucleus.name}
            </option>
          ))}
        </select>
      </div>

      <div className="reports-grid">
        <StellaAmountCard label="Total gasto" value={formatCurrency(summary.totalGasto)} />
        <StellaAmountCard label="Total pago" value={formatCurrency(summary.totalPago)} tone="success" />
        <StellaAmountCard label="Total a pagar" value={formatCurrency(summary.totalAPagar)} tone="warning" />
        <StellaAmountCard label="Total a receber" value={formatCurrency(summary.totalAReceber)} />
        <StellaAmountCard label="Assinaturas" value={formatCurrency(summary.totalAssinaturas)} />
        <StellaAmountCard
          label="Previsão do mês"
          value={formatCurrency(summary.previsaoMes)}
          tone={summary.previsaoMes >= 0 ? 'success' : 'danger'}
        />
      </div>

      <StellaConstellationDivider />

      <Breakdown
        title="Gastos por categoria"
        items={summary.porCategoria}
        nameFor={(id) => {
          const category = id ? categoryMap.get(id) : undefined;
          return category ? { name: category.name, icon: category.icon } : { name: 'Sem categoria', icon: '✦' };
        }}
        emptyMessage="Nenhum gasto neste mês para essa seleção."
      />

      <Breakdown
        title="Gastos por núcleo"
        items={summary.porNucleo}
        nameFor={(id) => {
          const nucleus = id ? nucleusMap.get(id) : undefined;
          return nucleus ? { name: nucleus.name, icon: nucleus.icon } : { name: 'Sem núcleo', icon: '✦' };
        }}
        emptyMessage="Nenhum gasto neste mês para essa seleção."
      />
    </ScreenShell>
  );
}
