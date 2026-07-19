import { StellaCard, StellaEmptyState, StellaSkeleton } from '@stella-founds/stella-ui';
import { formatCurrency, toDateOnly } from '@stella-founds/core';
import { useDashboardSummary } from './useDashboardSummary';
import './SummaryPanel.css';

/** Desktop right panel / tablet drawer content — no charts yet, just the four headline numbers. */
export function SummaryPanel() {
  const { summary, isLoading, error } = useDashboardSummary();

  return (
    <div className="summary-panel">
      <h2 className="summary-panel__title">Resumo financeiro</h2>
      {isLoading ? (
        <div className="summary-panel__list" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <StellaCard className="summary-panel__row" key={i}>
              <StellaSkeleton width={80} height={11} />
              <StellaSkeleton width={110} height={14} />
            </StellaCard>
          ))}
        </div>
      ) : error || !summary ? (
        <StellaEmptyState title="Resumo indisponível" message="Não foi possível carregar os dados agora." />
      ) : (
        <div className="summary-panel__list">
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Saldo previsto</span>
            <span className="summary-panel__value">{formatCurrency(summary.previstoAposContas)}</span>
          </StellaCard>
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Entradas</span>
            <span className="summary-panel__value">{formatCurrency(summary.entradasMes)}</span>
          </StellaCard>
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Saídas</span>
            <span className="summary-panel__value">{formatCurrency(summary.saidasMes)}</span>
          </StellaCard>
          <StellaCard className="summary-panel__row">
            <span className="summary-panel__label">Próxima conta</span>
            {summary.proximaConta ? (
              <span className="summary-panel__value">
                {summary.proximaConta.title} · {formatCurrency(summary.proximaConta.amount)} ·{' '}
                {toDateOnly(summary.proximaConta.dueDate ?? summary.proximaConta.createdAt)}
              </span>
            ) : (
              <StellaEmptyState title="Sem contas" message="Nenhuma conta pendente." />
            )}
          </StellaCard>
        </div>
      )}
    </div>
  );
}
